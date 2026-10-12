import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { CopyButton } from './Copy'

export type CodeLanguage = 'shell' | 'javascript' | 'python' | 'json' | 'http'

interface CodeBlockProps {
  /** What the code is: "curl", "Response" */
  label: ReactNode
  code: string
  /** What it is written in, for the syntax colours */
  language: CodeLanguage
  /** Leave the copy button out, for output nobody would paste */
  copyable?: boolean
  /** For show: fades out at the bottom, plain at rest, and under the pointer grows a little, comes back whole and gets its colours */
  live?: boolean
  className?: string
}

// How a comment starts, and the words that are part of the language itself
const COMMENT: Record<CodeLanguage, string | null> = { shell: '#', python: '#', javascript: '\\/\\/', json: null, http: null }
const KEYWORDS: Record<CodeLanguage, string | null> = {
  shell: 'curl|export',
  javascript: 'const|let|await|async|import|from|return|new',
  python: 'import|from|print|as|def|return',
  json: null,
  http: null,
}
const NEVER = '(?!)'

// One pass over the code: a comment to the end of its line, a string (followed by ":" it is a key),
// $VARIABLES, true/false/null and numbers, -flags, and the language's own words. A header's name counts as a key.
// A string is matched before a comment sign inside it is ever looked at, so "https://…" and "#fff" stay strings.
// shortcut: knows only what the snippets on this site contain, use a real highlighter for arbitrary code
function tokens(language: CodeLanguage): RegExp {
  const comment = COMMENT[language] ? `${COMMENT[language]}.*$` : NEVER
  const header = language === 'http' ? '^[A-Za-z-]+(?=:)' : NEVER
  return new RegExp(
    `(${comment})` +
      '|("(?:[^"\\\\]|\\\\.)*"|\'(?:[^\'\\\\]|\\\\.)*\'|`(?:[^`\\\\]|\\\\.)*`)(\\s*:)?' +
      `|(${header})` +
      '|(\\$[A-Z_]+|\\b(?:true|false|null|True|False|None)\\b|\\b\\d+(?:\\.\\d+)?\\b)' +
      '|((?<=\\s)-{1,2}[A-Za-z][\\w-]*)' +
      `|(\\b(?:${KEYWORDS[language] ?? NEVER})\\b)`,
    'gm',
  )
}

function highlight(code: string, language: CodeLanguage): ReactNode[] {
  const parts: ReactNode[] = []
  let last = 0
  for (const match of code.matchAll(tokens(language))) {
    const [, comment, string, colon, header, value, flag, keyword] = match
    const text = comment ?? string ?? header ?? value ?? flag ?? keyword
    const kind = comment
      ? 'comment'
      : string
        ? colon
          ? 'key'
          : 'string'
        : header
          ? 'key'
          : value
            ? 'value'
            : flag
              ? 'flag'
              : 'keyword'
    if (match.index > last) parts.push(code.slice(last, match.index))
    parts.push(
      <span key={match.index} data-tok={kind}>
        {text}
      </span>,
    )
    // the colon after a key was matched only to tell a key from a string; it is not part of the token
    last = match.index + text.length
  }
  parts.push(code.slice(last))
  return parts
}

/** A block of code with a header and syntax colours. Long lines scroll sideways inside the block, the page never does. */
export function CodeBlock({ label, code, language, copyable = true, live = false, className }: CodeBlockProps) {
  return (
    <div
      className={cx(
        'overflow-hidden rounded-lg border border-line bg-inset',
        live ? 'code-live fade-out relative hover:z-10' : 'code-colored',
        className,
      )}
    >
      <div className="flex h-10 items-center justify-between border-b border-line pr-1 pl-4">
        <div className="text-caption text-fg-3">{label}</div>
        {copyable && <CopyButton value={code} label="Copy code" withText />}
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-small text-fg" tabIndex={0}>
        <code>{highlight(code, language)}</code>
      </pre>
    </div>
  )
}
