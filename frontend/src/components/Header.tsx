import { Link } from '@tanstack/react-router'
import { useAuth } from '../lib/auth'
import { cx } from '../lib/cx'
import { AccountMenu } from './AccountMenu'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'
import { buttonClass } from './ui/buttonClass'

const navLink = 'rounded-md px-3 py-1.5 font-medium transition-colors'
const quiet = 'text-fg-2 hover:text-fg'

/**
 * The one top bar, on the public pages and in the dashboard alike. Signed out it offers Docs and the
 * way in; signed in it is the dashboard bar (Services, Docs, account menu) wherever the person is.
 */
export function Header() {
  const { status, user } = useAuth()

  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="rounded-lg">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {user && (
            <Link
              to="/services"
              className={navLink}
              activeProps={{ className: 'text-fg' }}
              inactiveProps={{ className: quiet }}
            >
              Services
            </Link>
          )}
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
          {user ? (
            <AccountMenu />
          ) : (
            <>
              <ThemeToggle className="max-sm:hidden" />
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
  )
}
