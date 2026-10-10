import { CircleNotchIcon } from '@phosphor-icons/react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { buttonClass, type ButtonSize, type ButtonVariant } from './buttonClass'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  /** Shows a spinner and blocks further presses, without changing the button's width */
  loading?: boolean
  icon?: ReactNode
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  icon,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(buttonClass({ variant, size, block }), 'relative', className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />
        </span>
      )}
      {/* faded out, not hidden: a hidden label would leave the button without a name for screen readers */}
      <span className={cx('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {icon}
        {children}
      </span>
    </button>
  )
}
