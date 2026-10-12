import { ApiError, api } from './api'
import { formatBytes } from './format'
import { keys, queryClient } from './queries'
import { nextId, uploads, type Upload } from './session'
import { MAX_PDF_BYTES, fileKind, type StoredFile } from './types'

// The same rule the service applies: 4 to 100 characters, starts with a letter or number, ends in one of the accepted endings
const NAME_RULE = /^(?=.{4,100}$)[A-Za-z0-9][A-Za-z0-9._-]*\.[A-Za-z]+$/

// Uploads run from here, not from the Files page, so they carry on when the person looks at another tab.
const waitingFiles = new Map<number, File>()
const running = new Set<string>()

function update(serviceId: string, change: (list: Upload[]) => Upload[]): void {
  uploads.set((all) => ({ ...all, [serviceId]: change(all[serviceId] ?? []) }))
}

/** Checks a file before it is sent, so an obvious "no" comes at once instead of after a round trip. */
function whyNot(file: File, taken: Set<string>): string | null {
  const kind = fileKind(file.name)
  if (!kind) return 'Only .md, .txt, .pdf, .html and .xml files are accepted.'
  if (!NAME_RULE.test(file.name)) {
    return 'Rename it first: letters, numbers, dots, dashes and underscores only, 100 characters at most.'
  }
  if (file.size === 0) return 'This file is empty.'
  if (file.size > kind.max) {
    return `This file is ${formatBytes(file.size)}. The limit is ${kind.max === MAX_PDF_BYTES ? '10 MB for a PDF' : '500 KB for this kind of file'}.`
  }
  if (taken.has(file.name)) return 'A file with this name is already stored. Delete it first to upload a new version.'
  return null
}

/** Queues files for a service. They are sent one at a time. */
export function addFiles(serviceId: string, files: File[]): void {
  const stored = queryClient.getQueryData<StoredFile[]>(keys.files(serviceId)) ?? []
  // a stored file that failed can be replaced by uploading the same name again
  const taken = new Set(stored.filter((file) => file.status !== 'failed').map((file) => file.source))
  for (const upload of uploads.get()[serviceId] ?? []) {
    if (upload.status !== 'failed') taken.add(upload.name)
  }

  const added = files.map((file): Upload => {
    const id = nextId()
    const error = whyNot(file, taken)
    if (error) return { id, name: file.name, size: file.size, status: 'failed', error }
    taken.add(file.name)
    waitingFiles.set(id, file)
    return { id, name: file.name, size: file.size, status: 'waiting' }
  })

  update(serviceId, (list) => [...list, ...added])
  void run(serviceId)
}

async function run(serviceId: string): Promise<void> {
  if (running.has(serviceId)) return
  running.add(serviceId)
  try {
    for (;;) {
      const next = (uploads.get()[serviceId] ?? []).find((upload) => upload.status === 'waiting')
      if (!next) break
      const file = waitingFiles.get(next.id)
      waitingFiles.delete(next.id)
      if (!file) {
        update(serviceId, (list) => list.filter((upload) => upload.id !== next.id))
        continue
      }

      update(serviceId, (list) =>
        list.map((upload) => (upload.id === next.id ? { ...upload, status: 'uploading' } : upload)),
      )
      try {
        // only returns once the file is converted (a PDF, a web page, XML), split and indexed: seconds for text, minutes for a long PDF
        await api.uploadFile(serviceId, file)
        update(serviceId, (list) => list.filter((upload) => upload.id !== next.id))
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'The upload failed. Try again.'
        update(serviceId, (list) =>
          list.map((upload) => (upload.id === next.id ? { ...upload, status: 'failed', error: message } : upload)),
        )
      }
      void queryClient.invalidateQueries({ queryKey: keys.files(serviceId) })
      void queryClient.invalidateQueries({ queryKey: keys.service(serviceId), exact: true })
    }
  } finally {
    running.delete(serviceId)
  }
}

/** Removes a rejected file's message from the page. */
export function dismissUpload(serviceId: string, uploadId: number): void {
  update(serviceId, (list) => list.filter((upload) => upload.id !== uploadId))
}
