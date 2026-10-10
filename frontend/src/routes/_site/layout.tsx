import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../components/ThemeToggle'
import { buttonClass } from '../../components/ui/buttonClass'
import { useAuth } from '../../lib/auth'
import { cx } from '../../lib/cx'

// Pathless: the frame around the public pages (the landing page and the docs).
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})

const navLink = 'rounded-md px-3 py-1.5 font-medium transition-colors'
const quiet = 'text-fg-2 hover:text-fg'

function SiteLayout() {
  const { status, user } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="rounded-lg">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Link to="/" hash="how-it-works" className={cx(navLink, quiet)}>
              How it works
            </Link>
            <Link
              to="/docs"
              className={navLink}
              activeProps={{ className: 'text-fg' }}
              inactiveProps={{ className: quiet }}
            >
              Docs
            </Link>
          </nav>
          {/* kept in place but hidden until the login is known, so the bar doesn't jump */}
          <div className={cx('ml-auto flex items-center gap-1 sm:gap-2', status === 'loading' && 'invisible')}>
            <ThemeToggle className="max-sm:hidden" />
            {user ? (
              <Link to="/services" className={buttonClass({ size: 'sm' })}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/sign-in" className={buttonClass({ variant: 'ghost', size: 'sm' })}>
                  Sign in
                </Link>
                <Link to="/register" className={buttonClass({ size: 'sm' })}>
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1184px] flex-col gap-4 px-4 py-8 text-small text-fg-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Rem RaaS</p>
          <nav className="flex items-center gap-6" aria-label="Footer">
            <Link to="/" hash="how-it-works" className="rounded hover:text-fg">
              How it works
            </Link>
            <Link to="/docs" className="rounded hover:text-fg">
              Docs
            </Link>
            {!user && (
              <Link to="/sign-in" className="rounded hover:text-fg">
                Sign in
              </Link>
            )}
            <ThemeToggle className="sm:hidden" />
          </nav>
        </div>
      </footer>
    </div>
  )
}
