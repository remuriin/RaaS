import { Link } from '@tanstack/react-router'
import { Logo } from '../components/Logo'
import { buttonClass } from '../components/ui/buttonClass'
import { useAuth } from '../lib/auth'
import { usePageTitle } from '../lib/usePageTitle'

// The "-" at the start of the file name keeps the router from treating this as a route.
// It is the page shown for any address that matches nothing.
export function NotFound() {
  usePageTitle('Page not found')
  const { user } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col px-4 py-6 sm:px-8">
      <Link to="/" className="self-start rounded-lg">
        <Logo />
      </Link>
      <main className="flex flex-1 flex-col items-center justify-center pb-16 text-center">
        <p className="font-mono text-display text-accent-fg">404</p>
        <h1 className="mt-4 text-h1">This page doesn&rsquo;t exist</h1>
        <p className="mt-2 max-w-sm text-body-lg text-fg-2">
          The address may be mistyped, or the service it pointed to was deleted.
        </p>
        <div className="mt-8">
          {user ? (
            <Link to="/services" className={buttonClass()}>
              Go to your services
            </Link>
          ) : (
            <Link to="/" className={buttonClass()}>
              Back to the home page
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
