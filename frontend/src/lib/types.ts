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
export const MAX_FILE_BYTES = 500 * 1024
export const MAX_NAME_LENGTH = 60
export const MAX_QUESTION_LENGTH = 2000
