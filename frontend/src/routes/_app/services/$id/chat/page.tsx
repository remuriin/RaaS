import { CaretRightIcon, ChatTextIcon, InfoIcon, PaperPlaneRightIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { Suspense, lazy, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { NotReady } from '../../../../../components/NotReady'
import { Alert } from '../../../../../components/ui/Alert'
import { Button } from '../../../../../components/ui/Button'
import { Card } from '../../../../../components/ui/Card'
import { Switch } from '../../../../../components/ui/Switch'
import { ask, clearChat } from '../../../../../lib/chat'
import { cx } from '../../../../../lib/cx'
import { useService } from '../../../../../lib/queries'
import { asking as askingStore, chats, type ChatMessage } from '../../../../../lib/session'
import { useStore } from '../../../../../lib/store'
import { MAX_QUESTION_LENGTH, type AnswerSource } from '../../../../../lib/types'

// The markdown renderer is only downloaded when an answer actually needs it
const Markdown = lazy(() => import('react-markdown'))

export const Route = createFileRoute('/_app/services/$id/chat/')({
  component: ChatPage,
})

const NO_MESSAGES: ChatMessage[] = []

function ChatPage() {
  const { id } = Route.useParams()
  const { data: service } = useService(id)
  const messages = useStore(chats)[id] ?? NO_MESSAGES
  const waiting = useStore(askingStore)[id] ?? false
  const [question, setQuestion] = useState('')
  const [markdown, setMarkdown] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const box = useRef<HTMLTextAreaElement>(null)

  // keep the newest message in view
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length, waiting])

  if (!service) return null
  if (service.status !== 'active') return <NotReady service={service} what="Chat test" />

  function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || waiting) return
    setQuestion('')
    if (box.current) box.current.style.height = ''
    void ask(id, trimmed, markdown)
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    send(question)
  }

  // Enter sends, Shift+Enter starts a new line
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // keyCode 229 is Safari's way of saying the Enter belonged to an input method (Japanese, Chinese...)
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229) {
      event.preventDefault()
      send(question)
    }
  }

  const left = MAX_QUESTION_LENGTH - question.length

  return (
    <Card className="flex flex-col">
      <div
        className="flex max-h-[60dvh] min-h-80 flex-col gap-5 overflow-y-auto p-5"
        role="log"
        aria-label="Conversation"
        aria-live="polite"
      >
        {messages.length === 0 && !waiting ? (
          <div className="m-auto flex max-w-sm flex-col items-center py-6 text-center">
            <ChatTextIcon className="size-8 text-fg-3" aria-hidden />
            <h2 className="mt-3 text-h3">Try your service</h2>
            {service.documents === 0 ? (
              <p className="mt-1 text-fg-2">
                This service has no files yet, so it has nothing to answer from.{' '}
                <Link to="/services/$id/files" params={{ id }} className="rounded text-accent-fg hover:underline">
                  Add files first
                </Link>
              </p>
            ) : (
              <p className="mt-1 text-fg-2">
                Ask something your files can answer. You get the same reply your app would, with its sources.
              </p>
            )}
          </div>
        ) : (
          messages.map((message) => <Message key={message.id} message={message} onRetry={send} busy={waiting} />)
        )}
        {waiting && <Typing />}
        <div ref={end} />
      </div>

      <form onSubmit={submit} className="border-t border-line p-5">
        <div className="flex items-end gap-3">
          <label htmlFor="question" className="sr-only">
            Your question
          </label>
          <textarea
            id="question"
            ref={box}
            rows={1}
            value={question}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Ask a question…"
            onChange={(event) => {
              setQuestion(event.target.value)
              // grow with the text, up to about five lines
              event.target.style.height = 'auto'
              event.target.style.height = `${Math.min(event.target.scrollHeight, 132)}px`
            }}
            onKeyDown={onKeyDown}
            className="min-h-10 w-full resize-none rounded-lg border border-line-strong bg-inset px-3 py-2 text-base text-fg placeholder:text-fg-3 hover:border-fg-3 focus-visible:outline-offset-0 md:text-body pointer-coarse:min-h-11"
          />
          <Button
            type="submit"
            disabled={!question.trim() || waiting}
            icon={<PaperPlaneRightIcon className="size-4" weight="fill" aria-hidden />}
          >
            Send
          </Button>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <Switch checked={markdown} onChange={setMarkdown} label="Markdown answers" />
          <p className="text-small text-fg-3">
            {left <= 200
              ? `${left} characters left`
              : 'Each question is answered on its own. Test questions count in your stats.'}
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={() => clearChat(id)}
            disabled={waiting}
            className="mt-3 rounded text-small text-fg-3 hover:text-fg disabled:opacity-50"
          >
            Clear conversation
          </button>
        )}
      </form>
    </Card>
  )
}

function Message({ message, onRetry, busy }: { message: ChatMessage; onRetry: (question: string) => void; busy: boolean }) {
  if (message.role === 'user') {
    return (
      <div className="max-w-[85%] self-end rounded-xl rounded-br-sm bg-accent-subtle px-3.5 py-2.5 whitespace-pre-wrap text-fg">
        {message.text}
      </div>
    )
  }

  if (message.role === 'error') {
    return (
      <Alert
        tone={message.title === 'The model is busy' ? 'warning' : 'danger'}
        title={message.title}
        className="max-w-xl"
        action={
          <Button variant="secondary" size="sm" onClick={() => onRetry(message.question)} disabled={busy}>
            Send it again
          </Button>
        }
      >
        {message.detail}
      </Alert>
    )
  }

  return (
    <div className="flex max-w-[85%] min-w-0 flex-col items-start gap-2 self-start sm:max-w-xl">
      <div
        className={cx(
          'rounded-xl rounded-bl-sm px-3.5 py-2.5',
          message.answered ? 'border border-line-strong text-fg' : 'bg-raised text-fg-2',
        )}
      >
        {message.markdown ? (
          <Suspense fallback={<p className="whitespace-pre-wrap">{message.text}</p>}>
            <div className="prose-answer">
              {/* no images: an answer could otherwise make the browser fetch a picture from anywhere */}
              <Markdown disallowedElements={['img']} unwrapDisallowed>
                {message.text}
              </Markdown>
            </div>
          </Suspense>
        ) : (
          <p className="whitespace-pre-wrap">{message.text}</p>
        )}
      </div>
      {message.answered ? (
        <Sources sources={message.sources} />
      ) : (
        <p className="flex items-center gap-1.5 text-small text-fg-3">
          <InfoIcon className="size-4" aria-hidden />
          Not answered from your files
        </p>
      )}
    </div>
  )
}

/** Where an answer came from: file name, then the heading inside it. */
function Sources({ sources }: { sources: AnswerSource[] }) {
  const seen = new Set<string>()
  const unique = sources.filter((source) => {
    const key = `${source.source}|${source.heading}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  if (unique.length === 0) return null

  return (
    <div className="flex max-w-full min-w-0 flex-wrap items-center gap-1.5">
      <span className="mr-0.5 text-small text-fg-3">Sources</span>
      {unique.map((source) => (
        // min-w-0 lets a long heading be cut off inside the chip instead of pushing the page wider
        <span
          key={`${source.source}|${source.heading}`}
          className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-raised px-2 py-1 font-mono text-caption text-fg-2"
          title={`${source.source} > ${source.heading}`}
        >
          <span className="truncate">{source.source}</span>
          {source.heading && (
            <>
              <CaretRightIcon className="size-3 shrink-0 text-fg-3" aria-hidden />
              <span className="truncate">{source.heading}</span>
            </>
          )}
        </span>
      ))}
    </div>
  )
}

function Typing() {
  return (
    <div
      className="flex h-10 items-center gap-1.5 self-start rounded-xl rounded-bl-sm border border-line-strong px-4"
      role="status"
      aria-label="Waiting for the answer"
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1.5 animate-blink rounded-full bg-fg-2"
          style={{ animationDelay: `${dot * 160}ms` }}
        />
      ))}
    </div>
  )
}
