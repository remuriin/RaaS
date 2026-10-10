import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { SocialButtons, type SocialProvider } from '../../../components/SocialButtons'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { Field, PasswordField } from '../../../components/ui/Field'
import {
  describeAuthError,
  registerWithEmail,
  signInWithGithub,
  signInWithGoogle,
  type AuthProblem,
} from '../../../lib/auth'
import { redirectIfSignedIn } from '../../../lib/guards'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_auth/register/')({
  beforeLoad: () => redirectIfSignedIn(),
  component: RegisterPage,
})

const MIN_PASSWORD = 8

function RegisterPage() {
  usePageTitle('Create your account')
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invalid, setInvalid] = useState<{ email?: string; password?: string }>({})
  const [problem, setProblem] = useState<AuthProblem | null>(null)
  const [busy, setBusy] = useState<'password' | SocialProvider | null>(null)

  async function enter(start: () => Promise<void>, method: 'password' | SocialProvider, then: '/verify-email' | '/services') {
    setBusy(method)
    setProblem(null)
    try {
      await start()
      await navigate({ to: then, replace: true })
    } catch (error) {
      setProblem(describeAuthError(error))
      setBusy(null)
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault()
    const found = {
      email: /^\S+@\S+\.\S+$/.test(email.trim()) ? undefined : 'Enter your email address',
      password: password.length >= MIN_PASSWORD ? undefined : `Use at least ${MIN_PASSWORD} characters`,
    }
    setInvalid(found)
    if (found.email || found.password) return
    // a new account gets a verification email, and has to open it before the dashboard lets it in
    void enter(() => registerWithEmail(email, password), 'password', '/verify-email')
  }

  return (
    <>
      <h1 className="text-h1">Create your account</h1>
      <p className="mt-1 text-body-lg text-fg-2">Your first service is a minute away.</p>

      {problem && !problem.field && (
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
          error={invalid.email ?? (problem?.field === 'email' ? problem.title : null)}
          hint="We send one email to this address, to confirm it is yours."
        />
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={invalid.password ?? (problem?.field === 'password' ? (problem.detail ?? problem.title) : null)}
          hint={`At least ${MIN_PASSWORD} characters.`}
        />
        <Button type="submit" block loading={busy === 'password'} disabled={busy !== null} className="mt-2">
          Create account
        </Button>
      </form>

      {/* a Gmail address through Google arrives already verified and goes straight in; any other address,
          and every GitHub account, is sent to "verify your email" first by the dashboard's own login check */}
      <SocialButtons
        onChoose={(provider) =>
          void enter(provider === 'google' ? signInWithGoogle : signInWithGithub, provider, '/services')
        }
        loading={busy === 'password' ? null : busy}
        disabled={busy !== null}
      />

      <p className="mt-8 text-center text-fg-2">
        Already have an account?{' '}
        <Link to="/sign-in" className="rounded font-medium text-accent-fg hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
