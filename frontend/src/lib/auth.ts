import { FirebaseError } from 'firebase/app'
import {
  GithubAuthProvider,
  GoogleAuthProvider,
  type AuthProvider,
  createUserWithEmailAndPassword,
  getAdditionalUserInfo,
  onIdTokenChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import { auth } from './firebase'
import { markSignedOut } from './session'
import { createStore, useStore } from './store'

export interface AuthUser {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  photoURL: string | null
}

export interface AuthState {
  /** "loading" until Firebase has restored (or failed to restore) the saved login */
  status: 'loading' | 'ready'
  user: AuthUser | null
}

function snapshot(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    emailVerified: user.emailVerified,
    displayName: user.displayName,
    photoURL: user.photoURL,
  }
}

function sameUser(a: AuthUser | null, b: AuthUser | null): boolean {
  return a?.uid === b?.uid && a?.emailVerified === b?.emailVerified && a?.email === b?.email
}

const authStore = createStore<AuthState>({ status: 'loading', user: null })

function publish(user: User | null): void {
  const next = user ? snapshot(user) : null
  const current = authStore.get()
  // Firebase also calls this on every hourly token refresh; only a real change should re-render the app
  if (current.status === 'ready' && sameUser(current.user, next)) return
  authStore.set({ status: 'ready', user: next })
}

onIdTokenChanged(auth, publish)

/** The signed-in user, for components. */
export function useAuth(): AuthState {
  return useStore(authStore)
}

/** Runs the callback whenever someone signs in, signs out, or becomes verified. */
export function onAuthChange(callback: (state: AuthState) => void): () => void {
  return authStore.subscribe(() => callback(authStore.get()))
}

// Where the link in a Firebase email sends people once they are done on Firebase's own page
function continueTo(path: string) {
  return { url: `${window.location.origin}${path}` }
}

async function sendVerification(user: User): Promise<void> {
  try {
    await sendEmailVerification(user, continueTo('/services'))
  } catch (error) {
    // The return address has to be on Firebase's authorized domains list. If this site isn't on it yet,
    // still send the email, just without the "continue" button at the end.
    if (error instanceof FirebaseError && error.code === 'auth/unauthorized-continue-uri') {
      await sendEmailVerification(user)
      return
    }
    throw error
  }
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password)
}

export async function registerWithEmail(email: string, password: string): Promise<void> {
  const { user } = await createUserWithEmailAndPassword(auth, email.trim(), password)
  await sendVerification(user)
}

/** Signs in through another company's own sign-in page, opened in a pop-up window. */
async function signInThrough(provider: AuthProvider): Promise<void> {
  const credential = await signInWithPopup(auth, provider)

  // Firebase only takes a provider's word for an email address in a few cases: a Gmail address through
  // Google is one, anything through GitHub is not. Every other account arrives "not verified" and has to
  // open a verification link, like a password account. The email is sent once, on the account's first
  // sign-in; after that the "verify your email" page can resend it.
  if (!credential.user.emailVerified && getAdditionalUserInfo(credential)?.isNewUser) {
    try {
      await sendVerification(credential.user)
    } catch {
      // the sign-in itself worked; the email can be asked for again from the next page
    }
  }
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  await signInThrough(provider)
}

export async function signInWithGithub(): Promise<void> {
  const provider = new GithubAuthProvider()
  // also returns the address when it is set to private on GitHub; without it there is nothing to verify
  provider.addScope('user:email')
  await signInThrough(provider)
}

export async function resendVerification(): Promise<void> {
  if (auth.currentUser) await sendVerification(auth.currentUser)
}

export async function sendPasswordReset(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(auth, email.trim(), continueTo('/sign-in'))
  } catch (error) {
    if (error instanceof FirebaseError && error.code === 'auth/unauthorized-continue-uri') {
      await sendPasswordResetEmail(auth, email.trim())
      return
    }
    throw error
  }
}

/**
 * Asks Firebase for the account's latest state. This is how the app finds out that the
 * verification link was opened, possibly in another tab or on another device.
 */
export async function refreshUser(): Promise<AuthUser | null> {
  const user = auth.currentUser
  if (!user) return null
  const wasVerified = user.emailVerified
  await user.reload()
  // The token still says "not verified" until it is renewed
  if (user.emailVerified && !wasVerified) await user.getIdToken(true)
  publish(auth.currentUser)
  return auth.currentUser ? snapshot(auth.currentUser) : null
}

export async function signOutUser(): Promise<void> {
  markSignedOut()
  await signOut(auth)
}

export interface AuthProblem {
  title: string
  detail?: string
  /** which form field the problem belongs to, when there is one */
  field?: 'email' | 'password'
}

/** Turns a Firebase error into words for the person looking at the form. Returns null when there is nothing to show. */
export function describeAuthError(error: unknown): AuthProblem | null {
  const code = error instanceof FirebaseError ? error.code : ''
  switch (code) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return null
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return {
        title: "That email and password don't match",
        detail: 'Check them and try again, or reset your password.',
        field: 'password',
      }
    case 'auth/invalid-email':
      return { title: "That doesn't look like an email address", field: 'email' }
    case 'auth/missing-password':
      return { title: 'Enter your password', field: 'password' }
    case 'auth/email-already-in-use':
      return {
        title: 'An account with this email already exists',
        detail: 'Sign in instead, or reset your password if you forgot it.',
        field: 'email',
      }
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements':
      return { title: 'Choose a stronger password', detail: 'Use at least 8 characters.', field: 'password' }
    case 'auth/too-many-requests':
      return { title: 'Too many attempts', detail: 'Wait a few minutes, then try again.' }
    case 'auth/user-disabled':
      return { title: 'This account has been disabled' }
    case 'auth/network-request-failed':
      return { title: "Can't reach the sign-in service", detail: 'Check your connection and try again.' }
    case 'auth/popup-blocked':
      return { title: 'The sign-in window was blocked', detail: 'Allow pop-ups for this site, then try again.' }
    case 'auth/account-exists-with-different-credential':
      return {
        title: 'This email already has an account',
        detail: 'Sign in the way you did when you created it.',
      }
    case 'auth/operation-not-allowed':
      return { title: "This sign-in method isn't turned on yet", detail: 'Use your email and password for now.' }
    case 'auth/unauthorized-domain':
      return {
        title: "Signing in this way isn't allowed from this address yet",
        detail: `"${window.location.hostname}" has to be added to the authorized domains in Firebase. Email and password still work.`,
      }
    default:
      return { title: 'Something went wrong', detail: 'Try again in a moment.' }
  }
}
