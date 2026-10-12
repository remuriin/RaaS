import { useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { HISTORY_CHARS, HISTORY_MESSAGES } from '../lib/types'
import { Card } from './ui/Card'
import { CodeBlock } from './ui/CodeBlock'

type Language = 'curl' | 'JavaScript' | 'Python'
const LANGUAGES: Language[] = ['curl', 'JavaScript', 'Python']

function askSnippet(language: Language, url: string): string {
  if (language === 'curl') {
    return `curl -X POST "${url}/query" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"How long do refunds take?"}'`
  }
  if (language === 'JavaScript') {
    return `const res = await fetch("${url}/query", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ question: "How long do refunds take?" }),
});

const { answer, sources, answered } = await res.json();`
  }
  return `import os
import requests

res = requests.post(
    "${url}/query",
    headers={"Authorization": f"Bearer {os.environ['API_KEY']}"},
    json={"question": "How long do refunds take?"},
)

print(res.json()["answer"])`
}

const RESPONSE = `{
  "answer": "Refunds are issued within 5 to 7 business days.",
  "sources": [
    { "source": "returns-and-refunds.md", "heading": "Returns and Refunds > Refunds" }
  ],
  "answered": true
}`

const uploadSnippet = (url: string) => `curl -X POST "${url}/documents/handbook.md" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: text/markdown" \\
  --data-binary @handbook.md`

const ENDPOINTS = [
  { method: 'POST', path: '/query', does: 'Ask a question' },
  { method: 'GET', path: '/documents', does: 'List the stored files' },
  { method: 'POST', path: '/documents/<name>', does: 'Add a file (the body is the file itself)' },
  { method: 'DELETE', path: '/documents/<name>', does: 'Delete a file' },
  { method: 'GET', path: '/health', does: 'Check the service is up (no key needed)' },
]

const methodColor: Record<string, string> = {
  GET: 'text-success',
  POST: 'text-accent-fg',
  DELETE: 'text-danger',
}

const ERRORS = [
  { status: '400', means: 'Something in the request is wrong. The message says what.' },
  { status: '401', means: 'The API key is missing or not valid.' },
  { status: '404', means: 'No such file or route.' },
  { status: '409', means: 'A file with that name is already stored. Delete it first.' },
  { status: '413', means: 'A PDF over 10 MB, another file over 500 KB, or a question with its history over 100 KB.' },
  { status: '415', means: "The upload's Content-Type does not match the ending of its name." },
  { status: '503', means: 'The model is busy or rate limited. Retry shortly.' },
]

const section = 'scroll-mt-24'

/**
 * How to call a service from an application. Used twice: on a service's "API guide" tab with its real
 * address filled in, and on the public docs page with a stand-in address.
 */
export function ApiReference({ url }: { url: string }) {
  const [language, setLanguage] = useState<Language>('curl')

  return (
    <>
      <Card className={cx('p-6', section)} id="ask">
        <h2 className="text-h3">Ask a question</h2>
        <p className="mt-2 max-w-2xl text-fg-2">
          Send the question as JSON. Nothing is remembered between requests: for a follow-up, your app sends the earlier
          messages along in <code className="font-mono text-small text-fg">history</code>.
        </p>

        <div className="mt-5 inline-flex rounded-lg border border-line bg-inset p-1" role="group" aria-label="Example language">
          {LANGUAGES.map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={language === item}
              onClick={() => setLanguage(item)}
              className={cx(
                'h-8 rounded-md px-3 text-small font-medium transition-colors pointer-coarse:h-10',
                language === item ? 'bg-raised text-fg' : 'text-fg-2 hover:text-fg',
              )}
            >
              {item}
            </button>
          ))}
        </div>
        <CodeBlock className="mt-3" label="Request" code={askSnippet(language, url)} />

        <h3 className="mt-7 text-caption text-fg-2">What you can send</h3>
        <dl className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
          <Term name="question" type="string, required">
            The question, at most 2,000 characters.
          </Term>
          <Term name="markdown" type="boolean, default false">
            Send <code className="font-mono text-small text-fg">true</code> if your app renders markdown. Otherwise
            answers are plain text with line breaks. A markdown answer uses only what it needs, and only from this
            list: numbered and bulleted lists, <code className="font-mono text-small text-fg">##</code> headings (when
            an answer covers more than one subject), bold, links and inline code. It never contains tables, images,
            quote blocks, divider lines or HTML, so any standard markdown renderer can show it.
          </Term>
          <Term name="topK" type="integer 1 to 20, default 5">
            How many passages from your files the answer may draw on.
          </Term>
          <Term name="history" type="array, optional">
            The earlier messages of the conversation, oldest first, each as{' '}
            <code className="font-mono text-small text-fg">{'{ "role": "user" | "assistant", "content": "…" }'}</code>.
            With it, a follow-up such as "and for exchanges?" is understood. Only the last {HISTORY_MESSAGES} messages
            and the first {HISTORY_CHARS} characters of each are used, so you can send the whole conversation. Leave it
            out and the question is answered on its own.
          </Term>
        </dl>

        <CodeBlock className="mt-7" label="Response" code={RESPONSE} copyable={false} />
        <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
          <Term name="answer" type="string">
            The reply, written only from your files.
          </Term>
          <Term name="sources" type="array">
            The file and the heading inside it that each part of the answer came from.
          </Term>
          <Term name="answered" type="boolean">
            <code className="font-mono text-small text-fg">false</code> when your files had nothing on the question,
            and for greetings. Use it to hand the conversation to a person.
          </Term>
        </dl>
      </Card>

      <Card className={cx('overflow-hidden', section)} id="files">
        <div className="p-6">
          <h2 className="text-h3">Manage files from your app</h2>
          <p className="mt-2 max-w-2xl text-fg-2">
            Files can be added and removed with the same key. A file name uses letters, numbers, dots, dashes and
            underscores, and its ending says what it is. There is no overwrite: delete a file, then upload the new
            version.
          </p>
          <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-[max-content_1fr]">
            <Term name=".md  .txt" type="text/markdown, text/plain">
              Stored as it is. Up to 500 KB.
            </Term>
            <Term name=".html  .xml" type="text/html, application/xml">
              Written out as markdown by a model first. Up to 500 KB.
            </Term>
            <Term name=".pdf" type="application/pdf">
              Written out as markdown by a model first, scanned pages included. Up to 10 MB, and about 60 pages: a
              longer one is refused whole, so split it.
            </Term>
          </dl>
          <p className="mt-4 max-w-2xl text-fg-2">
            Only the markdown is kept, not the original file. The request returns once the file is ready, which takes
            seconds for text and up to a few minutes for a long PDF.
          </p>
          <CodeBlock className="mt-5" label="Add a file" code={uploadSnippet(url)} />
        </div>
        <ul>
          {ENDPOINTS.map((endpoint) => (
            <li
              key={endpoint.method + endpoint.path}
              className="flex flex-col gap-x-6 gap-y-0.5 border-t border-line px-6 py-3 sm:flex-row sm:items-baseline"
            >
              <span className="flex shrink-0 items-baseline gap-3 font-mono text-small sm:w-72">
                <span className={cx('w-14 font-medium', methodColor[endpoint.method])}>{endpoint.method}</span>
                <span className="text-fg">{endpoint.path}</span>
              </span>
              <span className="text-fg-2">{endpoint.does}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className={cx('p-6', section)} id="errors">
        <h2 className="text-h3">Errors and limits</h2>
        <p className="mt-2 max-w-2xl text-fg-2">
          Every error is JSON with one field,{' '}
          <code className="font-mono text-small text-fg">{'{ "error": "…" }'}</code>, and a normal HTTP status. The
          message is written for people and can be shown as is.
        </p>
        <div className="mt-5 grid gap-x-10 gap-y-2.5 sm:grid-cols-2">
          {ERRORS.map((error) => (
            <p key={error.status} className="flex gap-4">
              <span className="w-8 shrink-0 font-mono text-small font-medium text-fg">{error.status}</span>
              <span className="text-fg-2">{error.means}</span>
            </p>
          ))}
        </div>
        <p className="mt-6 text-fg-2">
          Limits: 5 requests per second from one IP address, 10 MB per PDF and 500 KB per other file, 2,000 characters
          per question, 100 KB per
          question request. Of a conversation, the last {HISTORY_MESSAGES} messages and {HISTORY_CHARS} characters of
          each are used.
        </p>
      </Card>
    </>
  )
}

function Term({ name, type, children }: { name: string; type: string; children: ReactNode }) {
  return (
    <>
      <dt className="flex flex-wrap items-baseline gap-x-2">
        <code className="font-mono text-small font-medium text-fg">{name}</code>
        <span className="text-caption text-fg-3">{type}</span>
      </dt>
      <dd className="text-fg-2 max-sm:mb-1">{children}</dd>
    </>
  )
}
