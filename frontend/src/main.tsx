import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorPage } from './components/ErrorPage'
import { Splash } from './components/Splash'
import { onAuthChange } from './lib/auth'
import { queryClient } from './lib/queries'
import { clearSession } from './lib/session'
import { routeTree } from './routeTree.gen'

const router = createRouter({
  routeTree,
  // start loading a page's code when the pointer rests on a link to it
  defaultPreload: 'intent',
  // what to show when a page takes a moment to be ready (its login check is still running)
  defaultPendingComponent: Splash,
  defaultPendingMs: 400,
  // what to show when a page throws while drawing
  defaultErrorComponent: ErrorPage,
  scrollRestoration: true,
})

// Makes <Link to="..."> and useParams() type-checked against the real route list
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

// Whenever someone signs in, signs out or becomes verified, every route checks its login rule again.
// That is what moves a signed-out person off the dashboard, even when it happened in another tab.
let knownUid: string | null | undefined
onAuthChange(({ user }) => {
  const uid = user?.uid ?? null
  if (knownUid !== undefined && uid !== knownUid) {
    // a different person (or nobody) from here on: nothing of the previous account may stay behind
    queryClient.clear()
    clearSession()
  }
  knownUid = uid
  void router.invalidate()
})

// After a new build is put on the server, a tab that is still open may ask for a page file that no longer
// exists (the file names carry a hash of their content). Loading the page fresh picks up the new build.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault()
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
)
