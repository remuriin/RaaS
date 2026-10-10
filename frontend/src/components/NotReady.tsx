import { Link } from '@tanstack/react-router'
import type { Service } from '../lib/types'
import { buttonClass } from './ui/buttonClass'
import { Card } from './ui/Card'

/** What a tab shows when the service isn't in a state where that tab can do anything. */
export function NotReady({ service, what }: { service: Service; what: string }) {
  const reason: Record<Service['status'], string> = {
    active: '',
    pending: `${what} opens up as soon as the service is set up, usually within 15 seconds.`,
    failed: `This service failed to set up, so ${what.toLowerCase()} isn't available.`,
    deleting: 'This service is being deleted.',
  }
  return (
    <Card className="flex flex-col items-start gap-4 p-6">
      <div>
        <h2 className="text-h3">Not available yet</h2>
        <p className="mt-1 text-fg-2">{reason[service.status]}</p>
      </div>
      <Link
        to="/services/$id"
        params={{ id: service.id }}
        className={buttonClass({ variant: 'secondary', size: 'sm' })}
      >
        Go to overview
      </Link>
    </Card>
  )
}
