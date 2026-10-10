import { CodeIcon } from '@phosphor-icons/react'

/** Shown while a page is getting ready, mostly on the first load while the saved login is restored. */
export function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <span className="grid size-10 animate-pulse place-items-center rounded-xl bg-accent text-on-accent">
        <CodeIcon className="size-5" weight="bold" aria-hidden />
      </span>
    </div>
  )
}
