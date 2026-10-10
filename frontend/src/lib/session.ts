import { createStore } from './store'
import type { AnswerSource } from './types'

// Things that should survive moving between a service's tabs, but must never be saved anywhere:
// they live in memory only, and are wiped on sign-out or when the page is reloaded.

/** A newly generated API key, kept until the person confirms they copied it. Keyed by service id. */
export const shownKeys = createStore<Record<string, string>>({})

export type ChatMessage =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; text: string; sources: AnswerSource[]; answered: boolean; markdown: boolean }
  | { id: number; role: 'error'; title: string; detail: string; question: string }

/** The chat test conversation of each service. */
export const chats = createStore<Record<string, ChatMessage[]>>({})

/** Which services are waiting for an answer right now. */
export const asking = createStore<Record<string, boolean>>({})

export interface Upload {
  id: number
  name: string
  size: number
  status: 'waiting' | 'uploading' | 'failed'
  error?: string
}

/** Files on their way to a service, plus the ones that were turned away. */
export const uploads = createStore<Record<string, Upload[]>>({})

let lastId = 0
export function nextId(): number {
  lastId += 1
  return lastId
}

export function clearSession(): void {
  shownKeys.set({})
  chats.set({})
  asking.set({})
  uploads.set({})
}

// A one-line message carried across a redirect, shown once on the page that receives it
const NOTICE_KEY = 'raas-notice'
export type Notice = 'session-expired'

export function leaveNotice(notice: Notice): void {
  try {
    sessionStorage.setItem(NOTICE_KEY, notice)
  } catch {
    // no storage, no notice; the redirect still happens
  }
}

export function readNotice(): Notice | null {
  try {
    return sessionStorage.getItem(NOTICE_KEY) === 'session-expired' ? 'session-expired' : null
  } catch {
    return null
  }
}

export function clearNotice(): void {
  try {
    sessionStorage.removeItem(NOTICE_KEY)
  } catch {
    // nothing to clear
  }
}

// Someone who pressed "Sign out" should land on a plain sign-in page,
// not one that sends them straight back to where they just left.
let leftOnPurpose = false

export function markSignedOut(): void {
  leftOnPurpose = true
}

export function takeSignedOut(): boolean {
  const value = leftOnPurpose
  leftOnPurpose = false
  return value
}
