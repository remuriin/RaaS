import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ApiReference } from '../../../components/ApiReference'
import { Alert } from '../../../components/ui/Alert'
import { buttonClass } from '../../../components/ui/buttonClass'
import { Card } from '../../../components/ui/Card'
import { CodeBlock } from '../../../components/ui/CodeBlock'
import { useAuth } from '../../../lib/auth'
import { cx } from '../../../lib/cx'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_site/docs/')({
  component: DocsPage,
})

// A stand-in. On a service's own "API guide" tab the same examples carry that service's real address.
const EXAMPLE_URL = 'https://rag.remservers.me/i/<your-service-id>'

const SECTIONS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'ask', label: 'Ask a question' },
  { id: 'files', label: 'Manage files' },
  { id: 'errors', label: 'Errors and limits' },
]

const HOW = [
  {
    title: 'Your files are split into pieces',
    text: 'A PDF, a web page or XML is first written out as markdown. Then each file is cut at its headings into short sections, so a question can be matched to the exact part of a file that covers it.',
  },
  {
    title: 'Every piece gets a meaning, not just words',
    text: 'Each section is turned into an embedding: a numeric description of what it says. A question is matched by meaning, so "money back" still finds the section about refunds.',
  },
  {
    title: 'The answer comes only from the matched pieces',
    text: 'The best-matching sections are handed to the model with the question, and it is told to answer from those alone. Nothing from the open internet, nothing made up.',
  },
  {
    title: 'When nothing matches, it says so',
    text: 'If your files don\'t cover a question, the reply says that plainly and the response carries "answered": false, so your app can handle it.',
  },
]

const STEPS = [
  {
    title: 'Create a service',
    text: 'In the dashboard, choose "New service" and give it a name. It is ready in about 15 seconds.',
  },
  {
    title: 'Generate its API key',
    text: 'On the service\'s overview tab. The key is shown once, so copy it somewhere safe right away.',
  },
  {
    title: 'Upload your files',
    text: 'On the files tab, or from your own code. Markdown, text, PDF, HTML or XML: a PDF up to 10 MB, the others up to 500 KB.',
  },
  {
    title: 'Ask a question',
    text: 'Try it in the chat test tab first, then send the same request from your application.',
  },
]

function DocsPage() {
  usePageTitle('Docs')
  const { user } = useAuth()

  // The section being read: the last one whose top has passed under the bar. At the very bottom it is
  // the last section, which is too short to ever reach the top of the window.
  const [current, setCurrent] = useState(SECTIONS[0].id)
  useEffect(() => {
    const update = () => {
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      const passed = SECTIONS.filter((section) => (document.getElementById(section.id)?.getBoundingClientRect().top ?? Infinity) <= 140)
      setCurrent((atBottom ? SECTIONS[SECTIONS.length - 1] : (passed[passed.length - 1] ?? SECTIONS[0])).id)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="mx-auto grid w-full max-w-[1184px] grid-cols-1 gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:pt-16">
      <nav aria-label="On this page" className="hidden lg:block">
        {/* the bar (4rem + its 1px line) plus the page's 4rem of top padding: exactly where the list already
            sits, so it stays still from the first pixel of scrolling */}
        <div className="sticky top-[calc(8rem+1px)]">
          <p className="text-caption text-fg-3">On this page</p>
          <ul className="mt-3 flex flex-col gap-1 border-l border-line">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  aria-current={current === section.id ? 'location' : undefined}
                  className={cx(
                    '-ml-px block border-l py-1 pl-4 transition-colors',
                    current === section.id ? 'border-accent-fg font-medium text-fg' : 'border-transparent text-fg-2 hover:border-fg-3 hover:text-fg',
                  )}
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="flex min-w-0 flex-col gap-6">
        <header className="mb-2">
          <h1 className="text-4xl leading-tight font-semibold tracking-tight">Docs</h1>
          <p className="mt-3 max-w-2xl text-body-lg text-fg-2">
            Each service you create has its own small API. Your application talks to it with the service&rsquo;s
            address and its API key.
          </p>
        </header>

        <Card className="scroll-mt-24 p-6" id="how-it-works">
          <h2 className="text-h3">How it works</h2>
          <ol className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {HOW.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-mono text-h3 text-accent-fg">{index + 1}</span>
                <div>
                  <h3 className="font-medium text-fg">{step.title}</h3>
                  <p className="mt-1 text-fg-2">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="scroll-mt-24 p-6" id="quick-start">
          <h2 className="text-h3">Quick start</h2>
          <ol className="mt-5 grid gap-x-10 gap-y-6 sm:grid-cols-2">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="font-mono text-h3 text-accent-fg">{index + 1}</span>
                <div>
                  <h3 className="font-medium text-fg">{step.title}</h3>
                  <p className="mt-1 text-fg-2">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-7">
            {user ? (
              <Link to="/services" className={buttonClass()}>
                Open dashboard
              </Link>
            ) : (
              <Link to="/register" className={buttonClass()}>
                Get started
              </Link>
            )}
          </div>
        </Card>

        <Card className="scroll-mt-24 p-6" id="authentication">
          <h2 className="text-h3">Authentication</h2>
          <p className="mt-2 max-w-2xl text-fg-2">
            Every request except the health check carries the service&rsquo;s API key in the Authorization header.
            Each service has exactly one key. Generating a new one makes the old one stop working at once.
          </p>
          <CodeBlock className="mt-5 max-w-2xl" label="Header" language="http" code="Authorization: Bearer rag_your_api_key" copyable={false} />
          <Alert tone="warning" title="Keep the key on your server" live={false} className="mt-5 max-w-2xl">
            It gives full access to the service, including its files. Don&rsquo;t put it in browser or mobile app
            code.
          </Alert>
        </Card>

        <ApiReference url={EXAMPLE_URL} />
      </div>
    </div>
  )
}
