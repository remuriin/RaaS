import { cx } from '../../lib/cx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const base =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap select-none ' +
  'transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.98] ' +
  'disabled:pointer-events-none disabled:opacity-50 pointer-coarse:min-h-11'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-on-accent hover:bg-accent-hover',
  secondary: 'border border-line-strong bg-raised text-fg hover:bg-raised-hover',
  ghost: 'text-fg-2 hover:bg-raised hover:text-fg',
  danger: 'bg-danger-solid text-white hover:bg-danger-solid-hover',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-small',
  md: 'h-10 px-4 text-body',
  lg: 'h-12 px-6 text-body-lg',
}

/** The look of a button, for a <button> or for a link that should look like one. */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  block = false,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}): string {
  return cx(base, variants[variant], sizes[size], block && 'w-full')
}
