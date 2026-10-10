import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState, type FormEvent } from 'react'
import { SocialButtons, type SocialProvider } from '../../../components/SocialButtons'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Field, PasswordField } from '../../../components/ui/Field'
import {
  describeAuthError,
  signInWithEmail,
  signInWithGithub,
  signInWithGoogle,
  type AuthProblem,
} from '../../../lib/auth'
import { redirectIfSignedIn, safeRedirect } from '../../../lib/guards'
import { clearNotice, readNotice } from '../../../lib/session'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_auth/sign-in/')({
  // ?redirect=/services/abc is where to go back to afterwards; anything that isn't a path in this app is dropped
  validateSearch: (search: Record<string, unknown>): { redirect?: string } => ({
    redirect: safeRedirect(search.redirect),
  }),
  beforeLoad: ({ search }) => redirectIfSignedIn(search.redirect),
  component: SignInPage,
})

function SignInPage() {
  usePageTitle('Sign in')
  const { redirect: next } = Route.useSearch()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [missing, setMissing] = useState<{ email?: string; password?: string }>({})
  const [problem, setProblem] = useState<AuthProblem | null>(null)
  const [busy, setBusy] = useState<'password' | SocialProvider | null>(null)

  // set by the API layer when a login stopped being accepted in the middle of a session
  const [notice] = useState(readNotice)
  useEffect(clearNotice, [])

  async function enter(signIn: () => Promise<void>, method: 'password' | SocialProvider) {
    setBusy(method)
    setProblem(null)
    try {
      await signIn()
      // the dashboard's own login check sends an unverified account on to "verify your email"
      await navigate({ to: (next ?? '/services') as '/services', replace: true })
    } catch (error) {
      setProblem(describeAuthError(error))
      setBusy(null)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const gaps = {
      email: email.trim() ? undefined : 'Enter your email',
      password: password ? undefined : 'Enter your password',
    }
    setMissing(gaps)
    if (gaps.email || gaps.password) return
    void enter(() => signInWithEmail(email, password), 'password')
  }

  return (
    <>
      <h1 className="text-h1">Sign in</h1>
      <p className="mt-1 text-body-lg text-fg-2">Welcome back.</p>

      {notice === 'session-expired' && !problem && (
        <Alert tone="warning" title="Your session has expired" className="mt-6">
          Sign in again to carry on. Nothing you did was lost.
        </Alert>
      )}
      {problem && (
        <Alert tone="danger" title={problem.title} className="mt-6">
          {problem.detail}
        </Alert>
      )}

      <form onSubmit={submit} noValidate className="mt-6 flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          spellCheck={false}
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={missing.email ?? (problem?.field === 'email' ? problem.title : null)}
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={missing.password ?? (problem?.field === 'password' ? 'Wrong email or password.' : null)}
          aside={
            <Link to="/forgot-password" className="rounded text-caption text-accent-fg hover:underline">
              Forgot password?
            </Link>
          }
        />
        <Button type="submit" block loading={busy === 'password'} disabled={busy !== null} className="mt-2">
          Sign in
        </Button>
      </form>

      <SocialButtons
        onChoose={(provider) => void enter(provider === 'google' ? signInWithGoogle : signInWithGithub, provider)}
        loading={busy === 'password' ? null : busy}
        disabled={busy !== null}
      />

      <p className="mt-8 text-center text-fg-2">
        New here?{' '}
        <Link to="/register" className="rounded font-medium text-accent-fg hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}
