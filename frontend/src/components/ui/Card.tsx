import type { HTMLAttributes } from 'react'
import { cx } from '../../lib/cx'

/** The surface most dashboard content sits on. */
export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('rounded-xl border border-line bg-surface', className)} {...rest} />
}
