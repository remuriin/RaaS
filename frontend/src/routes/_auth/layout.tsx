import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import sheets from '../../assets/auth-sheets.webp'
import { Logo } from '../../components/Logo'
import { ThemeToggle } from '../../components/ThemeToggle'

// The "_" makes this folder pathless: it wraps the sign-in pages without adding to their address.
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

function AuthLayout() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-4 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="rounded-lg">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-rise">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Only on wide screens. The picture is decoration, so it is hidden from screen readers. */}
      <aside className="relative hidden overflow-hidden bg-[#020617] lg:block" aria-hidden>
        <img
          src={sheets}
          alt=""
          width={896}
          height={1200}
          className="absolute inset-0 size-full object-cover"
          decoding="async"
        />
        <div className="absolute inset-0 bg-linear-to-t from-[#020617] via-[#020617]/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <p className="max-w-md text-h1 text-white">Your documents already hold the answers.</p>
          <p className="mt-3 max-w-sm text-body-lg text-white/70">
            Upload them once and every question your app asks is answered from them, with the source attached.
          </p>
        </div>
      </aside>
    </div>
  )
}
