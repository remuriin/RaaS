import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from '../components/ui/Toaster'
import { NotFound } from './-not-found'

export const Route = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster />
      {/* shows which routes matched; renders nothing outside development */}
      <TanStackRouterDevtools position="bottom-left" />
    </>
  )
}
