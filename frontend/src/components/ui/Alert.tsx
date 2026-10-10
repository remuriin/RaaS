import { CheckCircleIcon, InfoIcon, WarningCircleIcon, WarningIcon } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

export type Tone = 'info' | 'success' | 'warning' | 'danger'

const tones: Record<Tone, { box: string; icon: string; Icon: typeof InfoIcon }> = {
  info: { box: 'border-accent/30 bg-accent-subtle', icon: 'text-accent-fg', Icon: InfoIcon },
  success: { box: 'border-success/30 bg-success-subtle', icon: 'text-success', Icon: CheckCircleIcon },
  warning: { box: 'border-warning/30 bg-warning-subtle', icon: 'text-warning', Icon: WarningIcon },
  danger: { box: 'border-danger/30 bg-danger-subtle', icon: 'text-danger', Icon: WarningCircleIcon },
}

interface AlertProps {
  tone: Tone
  title: string
  /** Announce it when it appears. On by default for danger and warning; turn off for text that is simply part of the page. */
  live?: boolean
  children?: ReactNode
  /** Buttons or links at the end of the message */
  action?: ReactNode
  className?: string
}

/** A message that sits in the page: something went wrong, needs care, or went well. */
export function Alert({ tone, title, children, action, className, live }: AlertProps) {
  const { box, icon, Icon } = tones[tone]
  const announce = live ?? (tone === 'danger' || tone === 'warning')
  return (
    <div
      role={announce ? 'alert' : 'status'}
      className={cx('flex gap-3 rounded-lg border px-4 py-3', box, className)}
    >
      <Icon className={cx('mt-0.5 size-4.5 shrink-0', icon)} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-fg">{title}</p>
        {children && <div className="mt-0.5 text-small text-fg-2">{children}</div>}
        {action && <div className="mt-3 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  )
}
