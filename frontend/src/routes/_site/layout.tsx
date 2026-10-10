import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useAuth } from '../../lib/auth'

// Pathless: the frame around the public pages (the landing page and the docs).
export const Route = createFileRoute('/_site')({
  component: SiteLayout,
})

function SiteLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-dvh flex-col">
      <Header />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-[1184px] flex-col gap-4 px-4 py-8 text-small text-fg-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Rem RaaS</p>
          <nav className="flex items-center gap-6" aria-label="Footer">
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
