import { signOut } from 'firebase/auth'
import { auth } from './firebase'
import { leaveNotice } from './session'
import type { Answer, NewKey, Service, StoredFile } from './types'

/** An error from the management API. `message` is written for end users and can be shown as is. */
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

// Used when the reply has no message of its own (for example an nginx error page instead of JSON)
const FALLBACK: Record<number, string> = {
  0: "Can't reach the server. Check your connection and try again.",
  401: 'Your session has expired. Sign in again to carry on.',
  403: 'This service belongs to another account.',
  404: "That doesn't exist any more.",
  413: 'That file is larger than 500 KB.',
  429: 'Too many requests. Wait a few seconds and try again.',
  502: "This service isn't responding right now. Try again in a moment.",
  503: 'The model is busy. Wait a few seconds and try again.',
}

async function send(path: string, init: RequestInit, token: string): Promise<Response> {
  try {
    return await fetch(`/api${path}`, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${token}` },
    })
  } catch {
    throw new ApiError(0, FALLBACK[0])
  }
}

/** True when the API refused the request because the token says the email isn't verified. */
async function saysUnverified(response: Response): Promise<boolean> {
  if (response.status !== 403) return false
  const body: unknown = await response.clone().json().catch(() => null)
  return typeof body === 'object' && body !== null && 'code' in body && body.code === 'email_not_verified'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser
  if (!user) throw new ApiError(401, FALLBACK[401])

  // getIdToken() hands back the saved token, or a fresh one when it has expired
  let response = await send(path, init, await user.getIdToken())
  // A saved token can be out of date in two ways: it expired (401), or it was issued before the email
  // was verified and still says "not verified" (403 with that code). Either way, try once more with a
  // token that is certainly new, before giving up.
  if (response.status === 401 || (await saysUnverified(response))) {
    response = await send(path, init, await user.getIdToken(true))
  }
  if (response.status === 401) {
    leaveNotice('session-expired')
    await signOut(auth)
    throw new ApiError(401, FALLBACK[401])
  }

  if (response.status === 204) return undefined as T

  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof body.error === 'string'
        ? body.error
        : (FALLBACK[response.status] ?? 'Something went wrong. Try again in a moment.')
    throw new ApiError(response.status, message)
  }
  return body as T
}

function json(method: string, data: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }
}

export interface ServiceDetails {
  name: string
  productName: string | null
}

export const api = {
  listServices: () => request<{ instances: Service[] }>('/instances').then((reply) => reply.instances),
  getService: (id: string) => request<Service>(`/instances/${id}`),
  createService: (details: ServiceDetails) => request<Service>('/instances', json('POST', details)),
  updateService: (id: string, details: Partial<ServiceDetails>) =>
    request<Service>(`/instances/${id}`, json('PATCH', details)),
  deleteService: (id: string) => request<{ id: string; status: 'deleting' }>(`/instances/${id}`, { method: 'DELETE' }),

  generateKey: (id: string) => request<NewKey>(`/instances/${id}/key`, { method: 'POST' }),

  listFiles: (id: string) =>
    request<{ documents: StoredFile[] }>(`/instances/${id}/documents`).then((reply) => reply.documents),
  // The body is the file itself, not JSON. The reply only comes once the file is fully indexed.
  uploadFile: (id: string, file: File) =>
    request<{ id: string; source: string; chunks: number; status: string }>(
      `/instances/${id}/documents/${encodeURIComponent(file.name)}`,
      { method: 'POST', headers: { 'Content-Type': 'text/markdown' }, body: file },
    ),
  deleteFile: (id: string, name: string) =>
    request<void>(`/instances/${id}/documents/${encodeURIComponent(name)}`, { method: 'DELETE' }),

  ask: (id: string, question: string, markdown: boolean) =>
    request<Answer>(`/instances/${id}/query`, json('POST', { question, markdown })),
}
