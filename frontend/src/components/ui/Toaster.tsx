import { CheckCircleIcon, WarningCircleIcon, XIcon } from '@phosphor-icons/react'
import { useStore } from '../../lib/store'
import { dismissToast, toasts } from '../../lib/toast'

/** Draws the toasts. Mounted once, at the root. */
export function Toaster() {
  const list = useStore(toasts)
  return (
    <div
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {list.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'danger' ? 'alert' : 'status'}
          className="pointer-events-auto flex w-full max-w-sm animate-toast items-start gap-3 rounded-xl border border-line-strong bg-raised px-4 py-3 shadow-pop"
        >
          {toast.tone === 'success' ? (
            <CheckCircleIcon className="mt-0.5 size-4.5 shrink-0 text-success" weight="fill" aria-hidden />
          ) : (
            <WarningCircleIcon className="mt-0.5 size-4.5 shrink-0 text-danger" weight="fill" aria-hidden />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-fg">{toast.title}</p>
            {toast.detail && <p className="mt-0.5 text-small text-fg-2">{toast.detail}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
            className="-mr-1 grid size-7 shrink-0 place-items-center rounded-md text-fg-3 transition-colors hover:text-fg"
          >
            <XIcon className="size-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  )
}
