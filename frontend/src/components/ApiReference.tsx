import { useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
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
  { method: 'POST', path: '/documents/<name>.md', does: 'Add a file (the body is the raw markdown)' },
  { method: 'DELETE', path: '/documents/<name>.md', does: 'Delete a file' },
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
  { status: '413', means: 'The file is larger than 500 KB.' },
  { status: '415', means: 'The upload was not sent as markdown or plain text.' },
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
          Send the question as JSON. Each question stands alone: there is no conversation memory between requests.
        </p>

        <div className="mt-5 inline-flex rounded-lg border border-line bg-inset p-1" role="tablist" aria-label="Language">
          {LANGUAGES.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={language === item}
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
            answers are plain text with line breaks.
          </Term>
          <Term name="topK" type="integer 1 to 20, default 5">
            How many passages from your files the answer may draw on.
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
            Files can be added and removed with the same key. A file name ends in .md and uses letters, numbers, dots,
            dashes and underscores. There is no overwrite: delete a file, then upload the new version.
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
          Limits: 5 requests per second from one IP address, 500 KB per file, 2,000 characters per question.
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
