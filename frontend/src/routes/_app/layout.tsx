import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { AccountMenu } from '../../components/AccountMenu'
import { Logo } from '../../components/Logo'
import { requireVerifiedUser } from '../../lib/guards'

// Pathless, like _auth. Everything under it is the signed-in part of the app, so the login check
// for the whole dashboard lives here, in one place: beforeLoad runs before any page inside is drawn.
export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => requireVerifiedUser(location.pathname),
  component: AppLayout,
})

const navLink = 'rounded-md px-3 py-1.5 font-medium transition-colors'
const quiet = 'text-fg-2 hover:text-fg'

function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-[1184px] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link to="/services" className="rounded-lg">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            <Link
              to="/services"
              className={navLink}
              activeProps={{ className: 'text-fg' }}
              inactiveProps={{ className: quiet }}
            >
              Services
            </Link>
            <Link to="/docs" className={`${navLink} ${quiet}`}>
              Docs
            </Link>
          </nav>
          <div className="ml-auto">
            <AccountMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1184px] flex-1 px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pt-12">
        <Outlet />
      </main>
    </div>
  )
}
