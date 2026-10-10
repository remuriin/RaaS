import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { CopyButton } from './Copy'

interface CodeBlockProps {
  /** What the code is: "curl", "Response" */
  label: ReactNode
  code: string
  /** Leave the copy button out, for output nobody would paste */
  copyable?: boolean
  /** For show: fades out at the bottom, and under the pointer grows a little, comes back whole and gets syntax colours */
  live?: boolean
  className?: string
}

// Strings (a string followed by ":" is a key), $VARIABLES, true/false/null and numbers, and -flags.
// shortcut: knows only what the landing page's curl and JSON samples contain, use a real highlighter for other languages
const TOKEN = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(\s*:)?|(\$[A-Z_]+|\b(?:true|false|null)\b|\b\d+(?:\.\d+)?\b)|((?<=\s)-{1,2}[A-Za-z][\w-]*)/g

function highlight(code: string): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of code.matchAll(TOKEN)) {
    const [, string, colon, value, flag] = match
    const text = string ?? value ?? flag
    if (match.index > last) parts.push(code.slice(last, match.index))
    parts.push(
      <span key={match.index} data-tok={string ? (colon ? 'key' : 'string') : value ? 'value' : 'flag'}>
        {text}
      </span>,
    )
    // the colon after a key was matched only to tell a key from a string; it is not part of the token
    last = match.index + text.length
  }
  parts.push(code.slice(last))
  return parts
}

/** A block of code with a header. Long lines scroll sideways inside the block, the page never does. */
export function CodeBlock({ label, code, copyable = true, live = false, className }: CodeBlockProps) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-lg border border-line bg-inset',
        live && 'code-live fade-out relative hover:z-10',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-line pr-1 pl-4">
        <div className="text-caption text-fg-3">{label}</div>
        {copyable && <CopyButton value={code} label="Copy code" withText />}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-small text-fg" tabIndex={0}>
        <code>{live ? highlight(code) : code}</code>
      </pre>
    </div>
  )
}
