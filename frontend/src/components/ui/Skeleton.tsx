import { cx } from '../../lib/cx'

/** A grey block in the shape of content that is still loading. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton', className)} aria-hidden />
}
