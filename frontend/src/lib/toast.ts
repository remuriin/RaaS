import { createStore } from './store'

export interface Toast {
  id: number
  tone: 'success' | 'danger'
  title: string
  detail?: string
}

export const toasts = createStore<Toast[]>([])

let lastId = 0

function show(tone: Toast['tone'], title: string, detail?: string): void {
  lastId += 1
  const id = lastId
  toasts.set((list) => [...list.slice(-2), { id, tone, title, detail }])
  // errors stay longer: they usually need reading twice
  window.setTimeout(() => dismissToast(id), tone === 'danger' ? 8000 : 5000)
}

export function dismissToast(id: number): void {
  toasts.set((list) => list.filter((toast) => toast.id !== id))
}

/** A short message that appears in the corner and goes away by itself. For things that just happened. */
export const toast = {
  success: (title: string, detail?: string) => show('success', title, detail),
  error: (title: string, detail?: string) => show('danger', title, detail),
}
