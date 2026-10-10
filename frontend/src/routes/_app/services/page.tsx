import { PlusIcon, StackIcon } from '@phosphor-icons/react'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CreateServiceDialog } from '../../../components/CreateServiceDialog'
import { ServiceCard } from '../../../components/ServiceCard'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Skeleton } from '../../../components/ui/Skeleton'
import { useServices } from '../../../lib/queries'
import { SERVICE_LIMIT } from '../../../lib/types'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_app/services/')({
  component: ServicesPage,
})

function ServicesPage() {
  usePageTitle('Services')
  const { data: services, error, isPending, refetch, isRefetching } = useServices()
  const [creating, setCreating] = useState(false)

  const count = services?.length ?? 0
  const atLimit = count >= SERVICE_LIMIT

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-h1">Services</h1>
          <p className="mt-1 text-fg-2">
            {services
              ? `${count} of ${SERVICE_LIMIT} services in use. Each one has its own files, API key and address.`
              : 'Each service has its own files, API key and address.'}
          </p>
        </div>
        <Button
          onClick={() => setCreating(true)}
          disabled={!services || atLimit}
          icon={<PlusIcon className="size-4" weight="bold" aria-hidden />}
          className="max-sm:w-full"
        >
          New service
        </Button>
      </div>

      <div className="mt-8">
        {isPending && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading your services">
            {[0, 1, 2].map((index) => (
              <div key={index} className="glass rounded-xl border border-line p-5">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="mt-2 h-4 w-3/5" />
                <Skeleton className="mt-5 h-9 w-full" />
                <Skeleton className="mt-5 h-4 w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && !services && (
          <Alert
            tone="danger"
            title="Your services couldn't be loaded"
            action={
              <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isRefetching}>
                Try again
              </Button>
            }
          >
            {error.message}
          </Alert>
        )}

        {services && atLimit && (
          <Alert tone="info" title={`You've reached the limit of ${SERVICE_LIMIT} services`} className="mb-6">
            Delete a service you no longer need to create another one.
          </Alert>
        )}

        {services && count === 0 && (
          <EmptyState
            icon={<StackIcon className="size-6" aria-hidden />}
            title="No services yet"
            action={
              <Button onClick={() => setCreating(true)} icon={<PlusIcon className="size-4" weight="bold" aria-hidden />}>
                New service
              </Button>
            }
          >
            A service holds your files and answers questions from them. Create one to get its address and API key.
          </EmptyState>
        )}

        {services && count > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>

      <CreateServiceDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}
