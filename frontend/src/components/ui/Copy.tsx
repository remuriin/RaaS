import { CheckIcon, CopyIcon } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { cx } from '../../lib/cx'
import { toast } from '../../lib/toast'

interface CopyButtonProps {
  value: string
  /** What is being copied, for screen readers: "Copy base URL" */
  label: string
  /** Show the word "Copy" next to the icon */
  withText?: boolean
  className?: string
}

/** Copies a value to the clipboard and says so for two seconds. */
export function CopyButton({ value, label, withText = false, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Couldn't copy", 'Select the text and copy it by hand.')
    }
  }

  const Icon = copied ? CheckIcon : CopyIcon
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'Copied' : label}
      className={cx(
        'inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-md text-small transition-colors',
        withText ? 'px-2' : 'w-8',
        copied ? 'text-success' : 'text-fg-3 hover:bg-raised hover:text-fg',
        className,
      )}
    >
      <Icon className="size-4" weight={copied ? 'bold' : 'regular'} aria-hidden />
      {withText && <span aria-hidden>{copied ? 'Copied' : 'Copy'}</span>}
    </button>
  )
}

interface CopyFieldProps {
  value: string
  /** What the value is, for the copy button: "base URL" */
  name: string
  className?: string
}

/** A value shown in monospace with a copy button at its end. Long values are cut off, never wrapped. */
export function CopyField({ value, name, className }: CopyFieldProps) {
  return (
    <div
      className={cx(
        'flex h-10 items-center gap-1 rounded-lg border border-line-strong bg-inset pr-1 pl-3',
        className,
      )}
    >
      <span className="min-w-0 flex-1 truncate font-mono text-small text-fg" title={value}>
        {value}
      </span>
      <CopyButton value={value} label={`Copy ${name}`} />
    </div>
  )
}
