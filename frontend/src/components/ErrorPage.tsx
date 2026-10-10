import { Link } from '@tanstack/react-router'
import { Logo } from './Logo'
import { Button } from './ui/Button'
import { buttonClass } from './ui/buttonClass'

/** Shown when a page throws while drawing. The error itself stays in the console, not on the page. */
export function ErrorPage({ reset }: { error: unknown; reset: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Link to="/" className="self-start rounded-lg">
        <Logo />
      </Link>
      <main className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <h1 className="text-h1">Something went wrong on this page</h1>
        <p className="mt-2 max-w-sm text-body-lg text-fg-2">Nothing you did was lost. Try again, or go back to your services.</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button onClick={reset}>Try again</Button>
          <Link to="/services" className={buttonClass({ variant: 'secondary' })}>
            Go to your services
          </Link>
        </div>
      </main>
    </div>
  )
}
