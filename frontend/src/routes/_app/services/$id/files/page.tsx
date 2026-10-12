import { CircleNotchIcon, FileTextIcon, FolderOpenIcon, TrashIcon, UploadSimpleIcon, XIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useRef, useState, type DragEvent } from 'react'
import { NotReady } from '../../../../../components/NotReady'
import { Alert } from '../../../../../components/ui/Alert'
import { Button } from '../../../../../components/ui/Button'
import { Card } from '../../../../../components/ui/Card'
import { Dialog } from '../../../../../components/ui/Dialog'
import { Skeleton } from '../../../../../components/ui/Skeleton'
import { cx } from '../../../../../lib/cx'
import { formatDate, plural } from '../../../../../lib/format'
import { useDeleteFile, useFiles, useService } from '../../../../../lib/queries'
import { uploads as uploadStore } from '../../../../../lib/session'
import { useStore } from '../../../../../lib/store'
import { toast } from '../../../../../lib/toast'
import { FILE_ACCEPT, type StoredFile } from '../../../../../lib/types'
import { addFiles, dismissUpload } from '../../../../../lib/uploader'

export const Route = createFileRoute('/_app/services/$id/files/')({
  component: FilesPage,
})

function FilesPage() {
  const { id } = Route.useParams()
  const { data: service } = useService(id)
  const active = service?.status === 'active'
  const { data: stored, error, isPending, refetch, isRefetching } = useFiles(id, active)
  const uploads = useStore(uploadStore)[id] ?? []
  const [removing, setRemoving] = useState<StoredFile | null>(null)

  if (!service) return null
  if (!active) return <NotReady service={service} what="Files" />

  const inFlight = uploads.filter((upload) => upload.status !== 'failed')
  const rejected = uploads.filter((upload) => upload.status === 'failed')
  // while a file is on its way the server already lists it as "processing"; show it once, as the upload
  const sending = new Set(inFlight.map((upload) => upload.name))
  const files = (stored ?? []).filter((file) => !(file.status === 'processing' && sending.has(file.source)))

  const ready = files.filter((file) => file.status === 'ready').length
  const processing = files.filter((file) => file.status === 'processing').length + inFlight.length
  const failed = files.filter((file) => file.status === 'failed').length
  const summary = [
    plural(ready, 'file') + ' ready',
    processing > 0 ? `${processing} processing` : null,
    failed > 0 ? `${failed} failed` : null,
  ].filter(Boolean)

  const nothing = stored !== undefined && files.length === 0 && inFlight.length === 0

  return (
    <div className="flex flex-col gap-6">
      <DropZone onFiles={(list) => addFiles(id, list)} />

      {rejected.length > 0 && (
        <ul className="flex flex-col gap-2">
          {rejected.map((upload) => (
            <li key={upload.id}>
              <Alert
                tone="danger"
                title={`${upload.name} wasn't added`}
                action={
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => dismissUpload(id, upload.id)}
                    icon={<XIcon className="size-3.5" aria-hidden />}
                  >
                    Dismiss
                  </Button>
                }
              >
                {upload.error}
              </Alert>
            </li>
          ))}
        </ul>
      )}

      {error && !stored && (
        <Alert
          tone="danger"
          title="The files couldn't be loaded"
          action={
            <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Alert>
      )}

      {isPending && (
        <Card className="p-5" role="status" aria-label="Loading the files">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-6 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Card>
      )}

      {nothing && (
        <div className="flex flex-col items-center px-6 py-10 text-center">
          <FolderOpenIcon className="size-8 text-fg-3" aria-hidden />
          <h2 className="mt-3 text-h3">No files yet</h2>
          <p className="mt-1 max-w-sm text-fg-2">
            The assistant answers only from the files stored here. Add your first one above.
          </p>
        </div>
      )}

      {stored && !nothing && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
            <h2 className="text-h3">Stored files</h2>
            <p className="text-small text-fg-3">{summary.join(', ')}</p>
          </div>
          <ul>
            {inFlight.map((upload) => (
              <li key={`upload-${upload.id}`} className="flex items-center gap-3 border-t border-line px-5 py-3.5">
                <CircleNotchIcon className="size-5 shrink-0 animate-spin text-warning" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-small text-fg">{upload.name}</p>
                  <p className="text-small text-fg-3">
                    {upload.status === 'uploading' ? 'Uploading and indexing…' : 'Waiting for its turn…'}
                  </p>
                </div>
                <span className="text-caption text-warning">Processing</span>
              </li>
            ))}
            {files.map((file) => (
              <FileRow key={file.id} file={file} onDelete={() => setRemoving(file)} />
            ))}
          </ul>
        </Card>
      )}

      <DeleteFileDialog serviceId={id} file={removing} onClose={() => setRemoving(null)} />
    </div>
  )
}

function FileRow({ file, onDelete }: { file: StoredFile; onDelete: () => void }) {
  return (
    <li className="flex items-center gap-3 border-t border-line px-5 py-3.5">
      <FileTextIcon className="size-5 shrink-0 text-fg-3" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-small text-fg" title={file.source}>
          {file.source}
        </p>
        {file.status === 'ready' && (
          <p className="text-small text-fg-3">
            {plural(file.chunks, 'chunk')}, added {formatDate(file.createdAt)}
          </p>
        )}
        {file.status === 'processing' && <p className="text-small text-fg-3">Being indexed…</p>}
        {file.status === 'failed' && (
          <p className="text-small text-danger">{file.error ?? 'It could not be processed. Upload it again to retry.'}</p>
        )}
      </div>
      {file.status === 'processing' && <span className="text-caption text-warning">Processing</span>}
      {file.status === 'failed' && <span className="text-caption text-danger">Failed</span>}
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${file.source}`}
        className="grid size-9 shrink-0 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-danger-subtle hover:text-danger pointer-coarse:size-11"
      >
        <TrashIcon className="size-4.5" aria-hidden />
      </button>
    </li>
  )
}

function DropZone({ onFiles }: { onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  function drop(event: DragEvent) {
    event.preventDefault()
    setOver(false)
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) onFiles(files)
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
      className={cx(
        'rounded-xl border border-dashed transition-colors duration-150',
        over ? 'border-accent-fg bg-accent-subtle' : 'border-line-strong bg-inset',
      )}
    >
      <button
        type="button"
        onClick={() => input.current?.click()}
        className="flex w-full flex-col items-center rounded-xl px-6 py-9 text-center"
      >
        <UploadSimpleIcon className="size-6 text-accent-fg" aria-hidden />
        <span className="mt-3 font-medium text-fg">
          Drop files here, or <span className="text-accent-fg">choose files</span>
        </span>
        <span className="mt-1 text-small text-fg-3">Markdown, text, PDF, HTML or XML</span>
        <span className="text-small text-fg-3">A PDF up to 10 MB, the others up to 500 KB each</span>
        <span className="mt-3 max-w-md text-small text-fg-3">
          A PDF, a web page or XML is first written out as markdown by a model. That takes a few seconds, or a few
          minutes for a long PDF. About 60 pages is the most that fits: split a longer one. Ask a few questions in the
          chat test afterwards to check it was read correctly.
        </span>
      </button>
      <p className="px-6 pb-6 text-center text-small text-fg-3">
        <Link to="/docs" hash="writing-files" className="rounded text-accent-fg hover:underline">
          How to write files that answer well
        </Link>
        {' · '}
        <a href="/rem-raas-template.md" download className="rounded text-accent-fg hover:underline">
          Download a template
        </a>{' '}
        (delete its notes before uploading, or they are read like the rest of the file)
      </p>
      <input
        ref={input}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          if (files.length > 0) onFiles(files)
          event.target.value = '' // so choosing the same file again still counts as a change
        }}
      />
    </div>
  )
}

function DeleteFileDialog({ serviceId, file, onClose }: { serviceId: string; file: StoredFile | null; onClose: () => void }) {
  const remove = useDeleteFile(serviceId)

  function confirm() {
    if (!file) return
    remove.mutate(file.source, {
      onSuccess: () => {
        toast.success(`${file.source} deleted`)
        onClose()
      },
      onError: (error) => {
        toast.error("The file wasn't deleted", error.message)
        onClose()
      },
    })
  }

  return (
    <Dialog
      open={file !== null}
      onClose={onClose}
      busy={remove.isPending}
      title="Delete this file?"
      description={
        <>
          The assistant stops using <span className="font-mono text-small text-fg">{file?.source}</span> right away.
          You can upload it again later.
        </>
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={remove.isPending}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirm} loading={remove.isPending}>
            Delete file
          </Button>
        </>
      }
    />
  )
}
