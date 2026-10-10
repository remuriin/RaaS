import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  children: ReactNode
  action?: ReactNode
}

/** What a list shows when there is nothing in it yet, and how to change that. */
export function EmptyState({ icon, title, children, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-line-strong px-6 py-14 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent-fg">{icon}</div>
      <h2 className="mt-4 text-h3 text-fg">{title}</h2>
      <p className="mt-1 max-w-sm text-fg-2">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
