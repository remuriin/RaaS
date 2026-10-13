import { ArrowRightIcon, CheckCircleIcon, CircleIcon, KeyIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type ReactNode } from 'react'
import { DeleteServiceDialog } from '../../../../components/DeleteServiceDialog'
import { Alert } from '../../../../components/ui/Alert'
import { Button } from '../../../../components/ui/Button'
import { Card } from '../../../../components/ui/Card'
import { CopyField } from '../../../../components/ui/Copy'
import { Dialog } from '../../../../components/ui/Dialog'
import { formatNumber, plural } from '../../../../lib/format'
import { useGenerateKey, useService } from '../../../../lib/queries'
import { shownKeys } from '../../../../lib/session'
import { useStore } from '../../../../lib/store'
import { toast } from '../../../../lib/toast'
import type { Service } from '../../../../lib/types'

export const Route = createFileRoute('/_app/services/$id/')({
  component: OverviewPage,
})

function OverviewPage() {
  const { id } = Route.useParams()
  const { data: service } = useService(id)
  if (!service) return null

  if (service.status === 'pending') return <Pending />
  if (service.status === 'failed') return <Failed service={service} />
  if (service.status === 'deleting') return <Deleting />

  return (
    <div className="flex flex-col gap-6">
      <NextSteps service={service} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Queries today" value={service.queries.today} note="from your app and the dashboard" />
        <Stat label="Last 7 days" value={service.queries.last7Days} note="questions answered" />
        <Stat label="Total queries" value={service.queries.total} note="since the service was created" />
        <Stat label="Files" value={service.documents} note={`${plural(service.chunks, 'chunk')} stored`} />
      </div>

      {/* grid-cols-1 matters on a phone: it lets the column shrink, so a long address is cut off instead of widening the page */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-h3">Service address</h2>
          <p className="mt-2 text-fg-2">Your application sends its questions to this address, with the API key.</p>
          <p className="mt-5 mb-1.5 text-caption text-fg-2">Base URL</p>
          <CopyField value={service.url} name="base URL" />
        </Card>
        <ApiKeyCard service={service} />
      </div>
    </div>
  )
}

function Stat({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <Card className="p-5">
      <p className="text-caption text-fg-2">{label}</p>
      <p className="mt-2 font-mono text-[1.75rem] leading-[2.125rem] font-medium tracking-tight text-fg">
        {formatNumber(value)}
      </p>
      <p className="mt-2 text-small text-fg-3">{note}</p>
    </Card>
  )
}

/** A short list of what is left to do on a service that isn't in use yet. Goes away once all of it is done. */
function NextSteps({ service }: { service: Service }) {
  const steps: { done: boolean; label: string; link: ReactNode }[] = [
    {
      done: service.keyPrefix !== null,
      label: 'Generate an API key',
      link: null,
    },
    {
      done: service.documents > 0,
      label: 'Upload your markdown files',
      link: (
        <Link to="/services/$id/files" params={{ id: service.id }} className="rounded text-accent-fg hover:underline">
          Open files
        </Link>
      ),
    },
    {
      done: service.queries.total > 0,
      label: 'Ask a test question',
      link: (
        <Link to="/services/$id/chat" params={{ id: service.id }} className="rounded text-accent-fg hover:underline">
          Open chat test
        </Link>
      ),
    },
  ]
  if (steps.every((step) => step.done)) return null

  return (
    <Card className="p-6">
      <h2 className="text-h3">Finish setting up</h2>
      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((step) => (
          <li key={step.label} className="flex items-center gap-3">
            {step.done ? (
              <CheckCircleIcon className="size-5 shrink-0 text-success" weight="fill" aria-hidden />
            ) : (
              <CircleIcon className="size-5 shrink-0 text-fg-3" aria-hidden />
            )}
            <span className={step.done ? 'text-fg-3 line-through' : 'text-fg'}>{step.label}</span>
            <span className="sr-only">{step.done ? '(done)' : '(to do)'}</span>
            {!step.done && step.link && <span className="ml-auto text-small">{step.link}</span>}
          </li>
        ))}
      </ol>
      <Link
        to="/services/$id/guide"
        params={{ id: service.id }}
        className="mt-5 inline-flex items-center gap-1.5 rounded text-small text-fg-2 hover:text-fg"
      >
        Then connect your app with the API guide
        <ArrowRightIcon className="size-3.5" aria-hidden />
      </Link>
    </Card>
  )
}

function ApiKeyCard({ service }: { service: Service }) {
  const generate = useGenerateKey(service.id)
  const newKey = useStore(shownKeys)[service.id]
  const [confirming, setConfirming] = useState(false)

  // Only ever called from a button press. Two tabs generating at once would cancel each other's key.
  function run() {
    generate.mutate(undefined, {
      onSuccess: () => setConfirming(false),
      onError: (error) => {
        setConfirming(false)
        toast.error("The key wasn't generated", error.message)
      },
    })
  }

  function forget() {
    shownKeys.set(({ [service.id]: _copied, ...rest }) => rest)
  }

  return (
    <Card className="p-6">
      <h2 className="text-h3">API key</h2>

      {newKey ? (
        <>
          <Alert tone="warning" title="Copy this key now" live={false} className="mt-4">
            It is not stored and cannot be shown again. If you lose it, generate a new one.
          </Alert>
          <p className="mt-5 mb-1.5 text-caption text-fg-2">Your new API key</p>
          <CopyField value={newKey} name="API key" />
          <Button variant="secondary" className="mt-4" onClick={forget}>
            I&rsquo;ve copied it
          </Button>
        </>
      ) : service.keyPrefix ? (
        <>
          <p className="mt-2 text-fg-2">
            The full key was shown once when it was created. Only its first characters are kept.
          </p>
          <p className="mt-5 flex h-10 items-center truncate rounded-lg border border-line-strong bg-inset px-3 font-mono text-small text-fg">
            {service.keyPrefix}
            <span className="text-fg-3" aria-hidden>
              {'•'.repeat(24)}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Button variant="secondary" onClick={() => setConfirming(true)}>
              Regenerate key
            </Button>
            <p className="text-small text-fg-3">The current key stops working immediately.</p>
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 text-fg-2">
            Your application needs a key to use this service. It is shown once, right after it is created.
          </p>
          <Button
            className="mt-5"
            onClick={run}
            loading={generate.isPending}
            icon={<KeyIcon className="size-4" weight="bold" aria-hidden />}
          >
            Generate API key
          </Button>
        </>
      )}

      <Dialog
        open={confirming}
        onClose={() => setConfirming(false)}
        busy={generate.isPending}
        title="Regenerate the API key?"
        description="The current key stops working immediately. Any app still using it gets errors until you give it the new key."
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={generate.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={run} loading={generate.isPending}>
              Regenerate key
            </Button>
          </>
        }
      />
    </Card>
  )
}

/** A thin bar that keeps moving, for work that has no known end time. */
function Working() {
  return (
    <div className="h-1 overflow-hidden rounded-full bg-raised" aria-hidden>
      <div className="h-full w-2/5 animate-slide rounded-full bg-accent" />
    </div>
  )
}

function Pending() {
  return (
    <Card className="p-6" role="status">
      <h2 className="text-h3">Setting up your service</h2>
      <p className="mt-2 max-w-xl text-fg-2">
        A private address and its own process are being prepared. This normally takes about 10 seconds, and this page
        updates by itself.
      </p>
      <div className="mt-6 max-w-xl">
        <Working />
      </div>
    </Card>
  )
}

function Deleting() {
  return (
    <Card className="p-6" role="status">
      <h2 className="text-h3">Deleting this service</h2>
      <p className="mt-2 max-w-xl text-fg-2">
        Its files, API key and address are being removed. This takes a few seconds.
      </p>
      <div className="mt-6 max-w-xl">
        <Working />
      </div>
    </Card>
  )
}

function Failed({ service }: { service: Service }) {
  const [deleting, setDeleting] = useState(false)
  return (
    <div className="flex flex-col gap-6">
      <Alert tone="danger" title="Setting up this service failed">
        {service.errorMessage ?? 'No reason was recorded.'}
      </Alert>
      <Card className="p-6">
        <h2 className="text-h3">What you can do</h2>
        <p className="mt-2 text-fg-2">
          A failed service is not retried. Delete it and create a new one; nothing was stored in it yet.
        </p>
        <Button variant="danger" className="mt-5" onClick={() => setDeleting(true)}>
          Delete service
        </Button>
      </Card>
      <DeleteServiceDialog service={service} open={deleting} onClose={() => setDeleting(false)} confirmName={false} />
    </div>
  )
}
