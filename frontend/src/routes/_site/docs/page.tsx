import { Link, createFileRoute } from '@tanstack/react-router'
import { ApiReference } from '../../../components/ApiReference'
import { Alert } from '../../../components/ui/Alert'
import { buttonClass } from '../../../components/ui/buttonClass'
import { Card } from '../../../components/ui/Card'
import { CodeBlock } from '../../../components/ui/CodeBlock'
import { useAuth } from '../../../lib/auth'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_site/docs/')({
  component: DocsPage,
})

// A stand-in. On a service's own "API guide" tab the same examples carry that service's real address.
const EXAMPLE_URL = 'https://rag.remservers.me/i/<your-service-id>'

const SECTIONS = [
  { id: 'quick-start', label: 'Quick start' },
  { id: 'authentication', label: 'Authentication' },
  { id: 'ask', label: 'Ask a question' },
  { id: 'files', label: 'Manage files' },
  { id: 'errors', label: 'Errors and limits' },
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
    title: 'Upload your markdown files',
    text: 'On the files tab, or from your own code. Each file can be up to 500 KB.',
  },
  {
    title: 'Ask a question',
    text: 'Try it in the chat test tab first, then send the same request from your application.',
  },
]

function DocsPage() {
  usePageTitle('Docs')
  const { user } = useAuth()

  return (
    <div className="mx-auto grid w-full max-w-[1184px] grid-cols-1 gap-10 px-4 pt-10 pb-20 sm:px-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-16 lg:px-8 lg:pt-16">
      <nav aria-label="On this page" className="hidden lg:block">
        <div className="sticky top-28">
          <p className="text-caption text-fg-3">On this page</p>
          <ul className="mt-3 flex flex-col gap-1 border-l border-line">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="-ml-px block border-l border-transparent py-1 pl-4 text-fg-2 transition-colors hover:border-fg-3 hover:text-fg"
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
          <CodeBlock className="mt-5 max-w-2xl" label="Header" code="Authorization: Bearer rag_your_api_key" copyable={false} />
          <Alert tone="warning" title="Keep the key on your server" className="mt-5 max-w-2xl">
            It gives full access to the service, including its files. Don&rsquo;t put it in browser or mobile app
            code.
          </Alert>
        </Card>

        <ApiReference url={EXAMPLE_URL} />
      </div>
    </div>
  )
}
