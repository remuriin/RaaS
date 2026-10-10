import { CaretRightIcon, FileTextIcon, PulseIcon } from '@phosphor-icons/react'
import { Link } from '@tanstack/react-router'
import { plural, shortUrl } from '../lib/format'
import type { Service } from '../lib/types'
import { StatusBadge } from './ui/StatusBadge'

const activity: Record<Exclude<Service['status'], 'active'>, string> = {
  pending: 'Setting up…',
  failed: 'Setup failed',
  deleting: 'Being deleted…',
}

/** One service in the list. The whole card is the link. */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <Link
      to="/services/$id"
      params={{ id: service.id }}
      className="group flex flex-col rounded-xl border border-line bg-surface p-5 transition-colors duration-150 hover:border-line-strong"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-h3 text-fg">{service.name}</h2>
          <p className="truncate text-small text-fg-2">
            {service.productName ? `Assistant for ${service.productName}` : 'No product name set'}
          </p>
        </div>
        <StatusBadge status={service.status} />
      </div>

      <p className="mt-4 truncate rounded-lg border border-line bg-inset px-3 py-2 font-mono text-small text-fg-2">
        {shortUrl(service.url)}
      </p>

      <div className="mt-4 flex items-center gap-4 text-small text-fg-2">
        <span className="inline-flex items-center gap-1.5">
          <FileTextIcon className="size-4 text-fg-3" aria-hidden />
          {plural(service.documents, 'file')}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <PulseIcon className="size-4 shrink-0 text-fg-3" aria-hidden />
          <span className="truncate">
            {service.status === 'active'
              ? `${plural(service.queries.today, 'query', 'queries')} today`
              : activity[service.status]}
          </span>
        </span>
        <CaretRightIcon
          className="ml-auto size-4 shrink-0 text-fg-3 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-fg"
          aria-hidden
        />
      </div>
    </Link>
  )
}
