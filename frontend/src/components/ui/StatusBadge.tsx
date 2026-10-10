import { cx } from '../../lib/cx'
import type { ServiceStatus } from '../../lib/types'

const looks: Record<ServiceStatus, { label: string; className: string; pulse: boolean }> = {
  active: { label: 'Active', className: 'bg-success-subtle text-success', pulse: false },
  pending: { label: 'Pending', className: 'bg-warning-subtle text-warning', pulse: true },
  failed: { label: 'Failed', className: 'bg-danger-subtle text-danger', pulse: false },
  deleting: { label: 'Deleting', className: 'bg-neutral-subtle text-neutral', pulse: true },
}

/** The state of a service. The dot pulses while something is still happening. */
export function StatusBadge({ status }: { status: ServiceStatus }) {
  const { label, className, pulse } = looks[status]
  return (
    <span className={cx('inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-caption', className)}>
      <span className={cx('size-1.5 rounded-full bg-current', pulse && 'animate-pulse')} aria-hidden />
      {label}
    </span>
  )
}
