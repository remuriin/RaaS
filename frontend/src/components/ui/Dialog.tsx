import { XIcon } from '@phosphor-icons/react'
import { useEffect, useId, useRef, type ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  /** The buttons at the bottom. Put the safe choice first. */
  footer?: ReactNode
  /** While true the dialog cannot be dismissed (a request is on its way) */
  busy?: boolean
}

/**
 * A modal dialog on the browser's own <dialog> element, which already does the hard parts:
 * it traps focus, closes on Escape, makes the page behind it inert, and hands focus back afterwards.
 */
export function Dialog({ open, onClose, title, description, children, footer, busy = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const pressedBackdrop = useRef(false)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
      // React's autoFocus ran while the dialog was still hidden, so it did nothing; focus the field now
      const first = dialog.querySelector<HTMLElement>('[autofocus], input, textarea, select')
      first?.focus()
    }
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Escape while a request is running: the browser only lets this be refused once per key press,
        // so a second Escape closes the dialog anyway. onClose below then keeps React in step.
        if (busy) event.preventDefault()
      }}
      // whatever closed the dialog (Escape, the browser's own gesture), React follows the DOM
      onClose={() => {
        if (open) onClose()
      }}
      // A click counts as "outside" only when it both started and ended on the backdrop,
      // so dragging a text selection out of an input does not close the dialog
      onMouseDown={(event) => {
        pressedBackdrop.current = event.target === event.currentTarget
      }}
      onClick={(event) => {
        if (pressedBackdrop.current && event.target === event.currentTarget && !busy) onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-2xl border border-line-strong bg-surface p-0 text-fg shadow-pop backdrop:bg-scrim open:animate-pop"
    >
      {open && (
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-h2">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="-mt-1 -mr-2 grid size-9 shrink-0 place-items-center rounded-lg text-fg-3 transition-colors hover:bg-raised hover:text-fg disabled:opacity-50"
            >
              <XIcon className="size-4.5" aria-hidden />
            </button>
          </div>
          {description && (
            <p id={descriptionId} className="mt-2 text-fg-2">
              {description}
            </p>
          )}
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}
