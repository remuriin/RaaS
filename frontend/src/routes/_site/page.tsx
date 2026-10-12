import {
  ArrowRightIcon,
  CaretRightIcon,
  ChartBarIcon,
  FileTextIcon,
  LockIcon,
  TranslateIcon,
} from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import ctaSheetsLight from '../../assets/cta-sheets-light.webp'
import ctaSheets from '../../assets/cta-sheets.webp'
import heroSheetsLight from '../../assets/hero-sheets-light.webp'
import heroSheets from '../../assets/hero-sheets.webp'
import tileSheetsLight from '../../assets/tile-sheets-light.webp'
import tileSheets from '../../assets/tile-sheets.webp'
import { Picture } from '../../components/Picture'
import { buttonClass } from '../../components/ui/buttonClass'
import { CodeBlock } from '../../components/ui/CodeBlock'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { redirectIfSignedIn } from '../../lib/guards'
import { usePageTitle } from '../../lib/usePageTitle'

export const Route = createFileRoute('/_site/')({
  // the landing page is for people who are not in yet; anyone signed in lands on their services
  beforeLoad: () => redirectIfSignedIn(),
  component: LandingPage,
})

const wrap = 'mx-auto w-full max-w-[1184px] px-4 sm:px-6 lg:px-8'

const REQUEST = `curl -X POST "$URL/query" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"question":"How long do refunds take?"}'`

const RESPONSE = `{
  "answer": "Refunds are issued within 5 to 7 business days.",
  "sources": [
    {
      "source": "returns-and-refunds.md",
      "heading": "Returns and Refunds > Refunds"
    }
  ],
  "answered": true
}`

function LandingPage() {
  usePageTitle()

  return (
    <>
      {/* Hero: the message on the left, a real answer on top of the picture on the right */}
      <section className={`${wrap} grid grid-cols-1 items-center gap-12 pt-12 pb-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-16 lg:pt-20 lg:pb-28`}>
        <div>
          <h1 className="animate-rise text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.25rem]">
            An API the answers from your documents
          </h1>
          <p className="mt-6 max-w-[34rem] animate-rise text-lg leading-8 text-fg-2 [animation-delay:80ms]">
            Upload your documents, get an address and a key, and let your app ask questions. Every answer names its
            sources.
          </p>
          <div className="mt-9 flex animate-rise flex-col gap-3 [animation-delay:160ms] sm:flex-row">
            <Link to="/register" className={`${buttonClass({ size: 'lg' })} group`}>
              Get started
              <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" aria-hidden />
            </Link>
            <Link to="/docs" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
              Read the docs
            </Link>
          </div>
        </div>

        <div className="relative animate-rise [animation-delay:240ms]">
          <Picture
            dark={heroSheets}
            light={heroSheetsLight}
            alt="Sheets of thin translucent paper falling onto a loose pile"
            width={872}
            height={1024}
            fetchPriority="high"
            className="mx-auto h-auto max-h-[30rem] w-auto"
          />
          {/* the same bubbles the dashboard's chat test draws */}
          <div className="glass relative -mt-24 ml-auto flex w-[92%] flex-col gap-3 rounded-xl border border-line-strong p-4 shadow-pop sm:-mt-28 sm:mr-6 sm:w-[78%] lg:absolute lg:right-auto lg:-bottom-10 lg:-left-10 lg:mt-0 lg:w-[70%]">
            <p className="self-end rounded-xl rounded-br-sm bg-accent-subtle px-3.5 py-2 text-fg">
              How long do refunds take?
            </p>
            <p className="self-start rounded-xl rounded-bl-sm border border-line-strong px-3.5 py-2 text-fg">
              Refunds are issued within 5 to 7 business days.
            </p>
            <p className="flex flex-wrap items-center gap-1.5 text-small text-fg-3">
              Sources
              <span className="inline-flex items-center gap-1.5 rounded-md bg-raised px-2 py-1 font-mono text-caption text-fg-2">
                returns-and-refunds.md
                <CaretRightIcon className="size-3 text-fg-3" aria-hidden />
                Refunds
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* How it works: the heading stays put while the three steps scroll past it */}
      <section id="how-it-works" className="scroll-mt-16 border-t border-line">
        <div className={`${wrap} grid grid-cols-1 gap-10 py-20 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16 lg:py-28`}>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              From a folder of files to a working endpoint
            </h2>
            <p className="mt-4 max-w-md text-body-lg text-fg-2">
              Three steps, and none of them involves running a model or a database yourself.
            </p>
          </div>
          <ol className="flex flex-col">
            <li className="reveal grid gap-4 border-t border-line py-8 first:border-t-0 first:pt-0 sm:grid-cols-[3rem_1fr]">
              <span className="font-mono text-h2 text-accent-fg">1</span>
              <div>
                <h3 className="text-h2">Create a service</h3>
                <p className="mt-2 max-w-lg text-body-lg text-fg-2">
                  It gets a private address and its own assistant, ready in about 15 seconds.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <StatusBadge status="pending" />
                  <ArrowRightIcon className="size-4 text-fg-3" aria-hidden />
                  <StatusBadge status="active" />
                </div>
              </div>
            </li>
            <li className="reveal grid gap-4 border-t border-line py-8 sm:grid-cols-[3rem_1fr]">
              <span className="font-mono text-h2 text-accent-fg">2</span>
              <div>
                <h3 className="text-h2">Upload your files</h3>
                <p className="mt-2 max-w-lg text-body-lg text-fg-2">
                  Add markdown, text, PDF, HTML or XML files. They are split and indexed, and usable as soon as the
                  upload finishes.
                </p>
                <p className="glass mt-4 inline-flex max-w-full items-center gap-2.5 rounded-lg border border-line px-3 py-2">
                  <FileTextIcon className="size-4.5 shrink-0 text-fg-3" aria-hidden />
                  <span className="truncate font-mono text-small text-fg">returns-and-refunds.md</span>
                  <span className="shrink-0 text-small text-fg-3">5 chunks</span>
                </p>
              </div>
            </li>
            <li className="reveal grid gap-4 border-t border-line py-8 pb-0 sm:grid-cols-[3rem_1fr]">
              <span className="font-mono text-h2 text-accent-fg">3</span>
              <div>
                <h3 className="text-h2">Ask from your app</h3>
                <p className="mt-2 max-w-lg text-body-lg text-fg-2">
                  Send a question with your API key and get back an answer, with the files it came from.
                </p>
                <p className="glass mt-4 inline-flex items-center gap-3 rounded-lg border border-line px-3 py-2 font-mono text-small">
                  <span className="font-medium text-accent-fg">POST</span>
                  <span className="text-fg">/query</span>
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      {/* What you can rely on: five tiles of different sizes, two of them more than text */}
      <section className="border-t border-line">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 className="max-w-xl text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
            Built to be trusted with your content
          </h2>
          <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-6">
            <article className="reveal glass fade-out relative min-h-96 overflow-hidden rounded-xl border border-line [--fade:55%] lg:col-span-4 lg:row-span-2">
              <div className="relative z-10 max-w-md p-6 sm:p-8">
                <h3 className="text-h2">Grounded answers</h3>
                <p className="mt-2 text-body-lg text-fg-2">
                  The assistant answers only from your files, and says so plainly when they don&rsquo;t cover a
                  question.
                </p>
              </div>
              <Picture
                dark={tileSheets}
                light={tileSheetsLight}
                alt="An open steel file drawer packed with sheets of thin paper"
                width={1149}
                height={725}
                loading="lazy"
                decoding="async"
                className="absolute -right-6 -bottom-16 h-auto w-[88%] max-w-2xl sm:w-[72%]"
              />
            </article>

            <article className="reveal glass rounded-xl border border-line p-6 lg:col-span-2">
              <h3 className="text-h3">Sources included</h3>
              <p className="mt-2 text-fg-2">Every answer lists the file and the section it came from.</p>
              <div className="mt-5 flex flex-col items-start gap-1.5">
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-raised px-2 py-1 font-mono text-caption text-fg-2">
                  <span className="truncate">shipping.md</span>
                  <CaretRightIcon className="size-3 shrink-0 text-fg-3" aria-hidden />
                  <span className="truncate">Delivery times</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-md bg-raised px-2 py-1 font-mono text-caption text-fg-2">
                  <span className="truncate">handbook.md</span>
                  <CaretRightIcon className="size-3 shrink-0 text-fg-3" aria-hidden />
                  <span className="truncate">Dress code</span>
                </span>
              </div>
            </article>

            <article className="reveal rounded-xl border border-accent/30 bg-accent-subtle p-6 lg:col-span-2">
              <LockIcon className="size-6 text-accent-fg" aria-hidden />
              <h3 className="mt-4 text-h3">Separate for every service</h3>
              <p className="mt-2 text-fg-2">
                Each service has its own files, key and address. One never sees another&rsquo;s content.
              </p>
            </article>

            <article className="reveal glass rounded-xl border border-line p-6 lg:col-span-3">
              <TranslateIcon className="size-6 text-accent-fg" aria-hidden />
              <h3 className="mt-4 text-h3">Answers that fit your app</h3>
              <p className="mt-2 max-w-md text-fg-2">
                Questions are answered in the language they were asked in, as plain text or as markdown when your
                app can render it.
              </p>
            </article>

            <article className="reveal glass rounded-xl border border-line p-6 lg:col-span-3">
              <ChartBarIcon className="size-6 text-accent-fg" aria-hidden />
              <h3 className="mt-4 text-h3">Usage at a glance</h3>
              <p className="mt-2 max-w-md text-fg-2">
                See how many questions each service answered today, over the last seven days and in total.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* The whole API in one request and one reply */}
      <section className="border-t border-line">
        <div className={`${wrap} py-20 lg:py-28`}>
          <h2 className="text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">One request, one answer</h2>
          <p className="mt-4 max-w-xl text-body-lg text-fg-2">
            No SDK to install. Anything that can send an HTTP request can ask your service a question.
          </p>
          <div className="reveal mt-10 grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
            <CodeBlock label="Request" code={REQUEST} live />
            <CodeBlock label="Response" code={RESPONSE} copyable={false} live />
          </div>
        </div>
      </section>

      {/* The limits, stated as plainly as the features */}
      <section className="border-t border-line">
        <div className={`${wrap} py-16 lg:py-20`}>
          <h2 className="text-h2">The limits, up front</h2>
          <dl className="reveal mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4 lg:divide-x lg:divide-line">
            <Limit value="3" unit="services" note="per account, each with its own files and key" />
            <Limit value="10" unit="MB" note="per PDF, and 500 KB for other files" />
            <Limit value="15" unit="seconds" note="or so to set up a new service" />
            <Limit value="5" unit="requests" note="per second from one IP address" />
          </dl>
        </div>
      </section>

      {/* The closing call to action, over the last picture */}
      <section className={`${wrap} pb-20 lg:pb-28`}>
        <div className="reveal glass relative overflow-hidden rounded-2xl border border-line">
          <Picture
            dark={ctaSheets}
            light={ctaSheetsLight}
            alt=""
            width={1258}
            height={631}
            loading="lazy"
            decoding="async"
            className="absolute top-1/2 right-6 hidden h-auto w-[44%] max-w-xl -translate-y-1/2 sm:block"
          />
          <div className="relative flex flex-col items-start gap-8 px-6 py-14 sm:max-w-[55%] sm:px-12 sm:py-20">
            <h2 className="max-w-lg text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
              Give your app an assistant that knows your docs
            </h2>
            <Link to="/register" className={`${buttonClass({ size: 'lg' })} group`}>
              Get started
              <ArrowRightIcon className="size-4 transition-transform duration-150 group-hover:translate-x-0.5" weight="bold" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}

function Limit({ value, unit, note }: { value: string; unit: string; note: string }) {
  return (
    <div className="lg:px-8 lg:first:pl-0">
      <dt className="flex items-baseline gap-2">
        <span className="font-mono text-4xl font-medium tracking-tight text-fg">{value}</span>
        <span className="text-body-lg text-fg-2">{unit}</span>
      </dt>
      <dd className="mt-2 text-fg-3">{note}</dd>
    </div>
  )
}
