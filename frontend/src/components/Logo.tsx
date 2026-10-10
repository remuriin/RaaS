import { CodeIcon } from '@phosphor-icons/react'
import { cx } from '../lib/cx'

/** The mark and the name. `size="lg"` is for the sign-in pages. */
export function Logo({ size = 'md', className }: { size?: 'md' | 'lg'; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2.5 font-semibold text-fg', className)}>
      <span
        className={cx(
          'grid place-items-center rounded-lg bg-accent text-on-accent',
          size === 'lg' ? 'size-9' : 'size-7',
        )}
      >
        <CodeIcon className={size === 'lg' ? 'size-5' : 'size-4'} weight="bold" aria-hidden />
      </span>
      <span className={size === 'lg' ? 'text-h2' : 'text-h3'}>Rem RaaS</span>
    </span>
  )
}
