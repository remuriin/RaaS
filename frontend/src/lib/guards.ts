import { redirect } from '@tanstack/react-router'
import { auth } from './firebase'
import { takeSignedOut } from './session'

// These run in a route's beforeLoad, before any of the page is drawn. They read Firebase directly
// (not React state), so they always see the login as it is at that exact moment.

/** Only a path inside this app is accepted as a place to go back to after signing in. */
export function safeRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return undefined
  try {
    return new URL(value, window.location.origin).pathname
  } catch {
    return undefined
  }
}

async function currentUser() {
  // resolves at once except on the very first page load, while the saved login is being restored
  await auth.authStateReady()
  const user = auth.currentUser
  if (user && !user.emailVerified) {
    // the verification link may have been opened since this tab last looked
    try {
      await user.reload()
      if (user.emailVerified) await user.getIdToken(true)
    } catch {
      // offline: carry on with what is known
    }
  }
  return auth.currentUser
}

/** For the dashboard: signed in and verified, or sent away. */
export async function requireVerifiedUser(pathname: string): Promise<void> {
  const user = await currentUser()
  if (!user) throw redirect({ to: '/sign-in', search: takeSignedOut() ? {} : { redirect: pathname } })
  if (!user.emailVerified) throw redirect({ to: '/verify-email' })
}

/** For sign in, register and forgot password: someone already signed in has no business there. */
export async function redirectIfSignedIn(next?: string): Promise<void> {
  const user = await currentUser()
  if (!user) return
  if (!user.emailVerified) throw redirect({ to: '/verify-email' })
  // `next` was checked by safeRedirect; the router only knows its own route list at type level
  throw redirect({ to: (next ?? '/services') as '/services' })
}

/** For the "check your email" page: only for someone signed in whose email is still unverified. */
export async function requireUnverifiedUser(): Promise<void> {
  const user = await currentUser()
  if (!user) throw redirect({ to: '/sign-in' })
  if (user.emailVerified) throw redirect({ to: '/services' })
}
