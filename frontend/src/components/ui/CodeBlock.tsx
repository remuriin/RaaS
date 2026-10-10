import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { CopyButton } from './Copy'

interface CodeBlockProps {
  /** What the code is: "curl", "Response" */
  label: ReactNode
  code: string
  /** Leave the copy button out, for output nobody would paste */
  copyable?: boolean
  className?: string
}

/** A block of code with a header. Long lines scroll sideways inside the block, the page never does. */
export function CodeBlock({ label, code, copyable = true, className }: CodeBlockProps) {
  return (
    <div className={cx('overflow-hidden rounded-lg border border-line bg-inset', className)}>
      <div className="flex h-10 items-center justify-between border-b border-line pr-1 pl-4">
        <div className="text-caption text-fg-3">{label}</div>
        {copyable && <CopyButton value={code} label="Copy code" withText />}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-small text-fg" tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  )
}
