import { ApiError, api } from './api'
import { keys, queryClient } from './queries'
import { asking, chats, nextId, type ChatMessage } from './session'
import { HISTORY_CHARS, HISTORY_MESSAGES, type ChatTurn } from './types'

function add(serviceId: string, message: ChatMessage): void {
  chats.set((all) => ({ ...all, [serviceId]: [...(all[serviceId] ?? []), message] }))
}

function describe(error: unknown): { title: string; detail: string } {
  const status = error instanceof ApiError ? error.status : -1
  if (status === 502) {
    return {
      title: "This service isn't responding right now",
      detail: 'Try again in a moment. If it keeps happening, the service may need attention.',
    }
  }
  if (status === 503) {
    return { title: 'The model is busy', detail: "Your question wasn't lost. Wait a few seconds and send it again." }
  }
  return {
    title: "Couldn't get an answer",
    detail: error instanceof Error ? error.message : 'Try again in a moment.',
  }
}

/** The conversation so far, as much of it as the service uses. A question that failed has no answer, so only its bubble counts. */
function historyOf(serviceId: string): ChatTurn[] {
  return (chats.get()[serviceId] ?? [])
    .flatMap((message) => (message.role === 'error' ? [] : [{ role: message.role, content: message.text.slice(0, HISTORY_CHARS) }]))
    .slice(-HISTORY_MESSAGES)
}

/** Sends one question to a service's chat test. Runs outside the page, so the answer still lands if the tab was switched. */
export async function ask(serviceId: string, question: string, markdown: boolean): Promise<void> {
  const history = historyOf(serviceId)
  add(serviceId, { id: nextId(), role: 'user', text: question })
  asking.set((all) => ({ ...all, [serviceId]: true }))
  try {
    const reply = await api.ask(serviceId, question, markdown, history)
    add(serviceId, {
      id: nextId(),
      role: 'assistant',
      text: reply.answer,
      sources: reply.sources,
      answered: reply.answered,
      markdown,
    })
  } catch (error) {
    add(serviceId, { id: nextId(), role: 'error', question, ...describe(error) })
  } finally {
    asking.set((all) => ({ ...all, [serviceId]: false }))
    // test questions count in the service's query numbers
    void queryClient.invalidateQueries({ queryKey: keys.service(serviceId), exact: true })
  }
}

export function clearChat(serviceId: string): void {
  chats.set((all) => ({ ...all, [serviceId]: [] }))
}
