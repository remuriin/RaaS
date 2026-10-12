// The shapes the management API sends back. Kept in step with backend/API.md.

export type ServiceStatus = 'pending' | 'active' | 'failed' | 'deleting'

export interface Service {
  id: string
  name: string
  productName: string | null
  status: ServiceStatus
  errorMessage: string | null
  url: string
  keyPrefix: string | null
  documents: number
  chunks: number
  queries: { today: number; last7Days: number; total: number }
  createdAt: string
}

export interface StoredFile {
  id: string
  source: string
  status: 'processing' | 'ready' | 'failed'
  error: string | null
  chunks: number
  createdAt: string
}

export interface AnswerSource {
  source: string
  heading: string
}

export interface Answer {
  answer: string
  sources: AnswerSource[]
  answered: boolean
}

/** One earlier message of a conversation, sent along with a question so a follow-up is understood. */
export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

/** How much of a conversation a service uses: the last messages, and the start of each. */
export const HISTORY_MESSAGES = 6
export const HISTORY_CHARS = 500

export interface NewKey {
  apiKey: string
  keyPrefix: string
  note: string
}

export const SERVICE_LIMIT = 3
export const MAX_TEXT_BYTES = 500 * 1024
export const MAX_PDF_BYTES = 10 * 1024 * 1024

/** The kinds of file a service takes, by the ending of the name: what it is sent as, and how large it may be. */
const FILE_KINDS: Record<string, { type: string; max: number }> = {
  md: { type: 'text/markdown', max: MAX_TEXT_BYTES },
  txt: { type: 'text/plain', max: MAX_TEXT_BYTES },
  html: { type: 'text/html', max: MAX_TEXT_BYTES },
  htm: { type: 'text/html', max: MAX_TEXT_BYTES },
  xml: { type: 'application/xml', max: MAX_TEXT_BYTES },
  pdf: { type: 'application/pdf', max: MAX_PDF_BYTES },
}
/** What the file picker offers. Kept next to the list above so the two cannot drift apart. */
export const FILE_ACCEPT = Object.keys(FILE_KINDS).map((ending) => `.${ending}`).join(',')

export function fileKind(name: string): { type: string; max: number } | null {
  return FILE_KINDS[name.slice(name.lastIndexOf('.') + 1).toLowerCase()] ?? null
}
export const MAX_NAME_LENGTH = 60
export const MAX_QUESTION_LENGTH = 2000
