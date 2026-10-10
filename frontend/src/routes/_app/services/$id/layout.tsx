import { Link, Outlet, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Alert } from '../../../../components/ui/Alert'
import { Button } from '../../../../components/ui/Button'
import { buttonClass } from '../../../../components/ui/buttonClass'
import { Skeleton } from '../../../../components/ui/Skeleton'
import { StatusBadge } from '../../../../components/ui/StatusBadge'
import { ApiError } from '../../../../lib/api'
import { formatWhen } from '../../../../lib/format'
import { keys, queryClient, useService } from '../../../../lib/queries'
import { toast } from '../../../../lib/toast'
import type { Service, ServiceStatus } from '../../../../lib/types'
import { usePageTitle } from '../../../../lib/usePageTitle'

// "$id" in the folder name is a parameter: it matches whatever is in that position of the address.
export const Route = createFileRoute('/_app/services/$id')({
  component: ServiceLayout,
})

// `open` says in which states of the service a tab can be used
const TABS = [
  { to: '/services/$id', label: 'Overview', exact: true, open: () => true },
  { to: '/services/$id/files', label: 'Files', exact: false, open: (status: ServiceStatus) => status === 'active' },
  { to: '/services/$id/chat', label: 'Chat test', exact: false, open: (status: ServiceStatus) => status === 'active' },
  { to: '/services/$id/guide', label: 'API guide', exact: false, open: (status: ServiceStatus) => status === 'active' },
  { to: '/services/$id/settings', label: 'Settings', exact: false, open: (status: ServiceStatus) => status !== 'deleting' },
] as const

function ServiceLayout() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: service, error, refetch, isRefetching } = useService(id)
  usePageTitle(service?.name)

  const gone = error instanceof ApiError && error.status === 404
  // remembers that this service was seen on its way out, so its 404 afterwards means "deleted", not "never existed"
  const [wasDeleting, setWasDeleting] = useState(false)
  if (service?.status === 'deleting' && !wasDeleting) setWasDeleting(true)

  // A service that was being deleted and now answers 404 has finished deleting: back to the list.
  useEffect(() => {
    if (!gone) return
    queryClient.setQueryData<Service[]>(keys.services, (list) => list?.filter((item) => item.id !== id))
    if (wasDeleting) {
      toast.success('Service deleted')
      void navigate({ to: '/services', replace: true })
    }
  }, [gone, wasDeleting, id, navigate])

  if (gone) {
    if (wasDeleting) return null
    return (
      <div className="flex flex-col items-start gap-4 py-10">
        <div>
          <h1 className="text-h1">This service doesn&rsquo;t exist</h1>
          <p className="mt-2 text-body-lg text-fg-2">It may have been deleted, or the address is mistyped.</p>
        </div>
        <Link to="/services" className={buttonClass()}>
          Back to your services
        </Link>
      </div>
    )
  }

  if (!service) {
    if (error) {
      return (
        <Alert
          tone="danger"
          title="This service couldn't be loaded"
          action={
            <Button variant="secondary" size="sm" onClick={() => void refetch()} loading={isRefetching}>
              Try again
            </Button>
          }
        >
          {error.message}
        </Alert>
      )
    }
    return (
      <div role="status" aria-label="Loading the service">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-7 h-9 w-64" />
        <Skeleton className="mt-3 h-4 w-72" />
        <Skeleton className="mt-9 h-10 w-full" />
        <Skeleton className="mt-8 h-40 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <>
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-small">
        <Link to="/services" className="rounded text-accent-fg hover:underline">
          Services
        </Link>
        <span className="text-fg-3" aria-hidden>
          /
        </span>
        <span className="truncate text-fg-2" aria-current="page">
          {service.name}
        </span>
      </nav>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="min-w-0 text-h1 break-words">{service.name}</h1>
        <StatusBadge status={service.status} />
      </div>
      <p className="mt-1 text-fg-2">
        {service.productName ? `Assistant for ${service.productName}` : 'No product name set'}
        <span className="mx-2 text-fg-3" aria-hidden>
          ·
        </span>
        Created {formatWhen(service.createdAt)}
      </p>

      {/* The tabs scroll sideways on a phone instead of wrapping onto a second line */}
      <nav
        aria-label="Service sections"
        className="-mx-4 mt-8 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0"
      >
        <div className="flex min-w-max gap-7 border-b border-line">
          {TABS.map((tab) =>
            tab.open(service.status) ? (
              <Link
                key={tab.to}
                to={tab.to}
                params={{ id }}
                activeOptions={{ exact: tab.exact }}
                className="-mb-px border-b-2 py-3 font-medium transition-colors"
                activeProps={{ className: 'border-accent text-fg' }}
                inactiveProps={{ className: 'border-transparent text-fg-2 hover:text-fg' }}
              >
                {tab.label}
              </Link>
            ) : (
              <span key={tab.to} className="-mb-px border-b-2 border-transparent py-3 font-medium text-fg-3 opacity-50">
                {tab.label}
                <span className="sr-only">, not available while the service is {service.status}</span>
              </span>
            ),
          )}
        </div>
      </nav>

      <div className="mt-8">
        <Outlet />
      </div>
    </>
  )
}
