import { EyeIcon, EyeSlashIcon } from '@phosphor-icons/react'
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cx } from '../../lib/cx'

// 16px text on phones, so iOS does not zoom the page when an input is tapped
const inputClass =
  'h-10 w-full rounded-lg border bg-inset px-3 text-base text-fg placeholder:text-fg-3 ' +
  'transition-colors duration-150 focus-visible:outline-offset-0 disabled:opacity-60 md:text-body ' +
  'pointer-coarse:h-11'

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Shown under the input when there is no error */
  hint?: ReactNode
  error?: string | null
  /** Something on the same line as the label, at the far end (a link, a counter) */
  aside?: ReactNode
  /** Something inside the input, at its far end */
  trailing?: ReactNode
}

/** A labelled text input: label above, hint or error below. */
export function Field({ label, hint, error, aside, trailing, className, id, ...rest }: FieldProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={inputId} className="text-caption text-fg-2">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cx(
            inputClass,
            error ? 'border-danger' : 'border-line-strong hover:border-fg-3',
            trailing ? 'pr-11' : undefined,
            className,
          )}
          {...rest}
        />
        {trailing && <div className="absolute inset-y-0 right-1 flex items-center">{trailing}</div>}
      </div>
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-small text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${inputId}-hint`} className="text-small text-fg-3">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

/** A password input with a button to show what was typed. */
export function PasswordField(props: Omit<FieldProps, 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  const Icon = visible ? EyeSlashIcon : EyeIcon
  return (
    <Field
      {...props}
      type={visible ? 'text' : 'password'}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="grid size-8 place-items-center rounded-md text-fg-3 transition-colors hover:text-fg"
        >
          <Icon className="size-4.5" aria-hidden />
        </button>
      }
    />
  )
}
