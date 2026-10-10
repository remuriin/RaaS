import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Header } from '../../components/Header'
import { requireVerifiedUser } from '../../lib/guards'

// Pathless, like _auth. Everything under it is the signed-in part of the app, so the login check
// for the whole dashboard lives here, in one place: beforeLoad runs before any page inside is drawn.
export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => requireVerifiedUser(location.pathname),
  component: AppLayout,
})

function AppLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1184px] flex-1 px-4 pt-8 pb-20 sm:px-6 lg:px-8 lg:pt-12">
        <Outlet />
      </main>
    </div>
  )
}
