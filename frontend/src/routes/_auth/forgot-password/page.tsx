import { ArrowLeftIcon, EnvelopeSimpleIcon } from '@phosphor-icons/react'
import { Link, createFileRoute } from '@tanstack/react-router'
import { useState, type FormEvent } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { buttonClass } from '../../../components/ui/buttonClass'
import { Field } from '../../../components/ui/Field'
import { describeAuthError, sendPasswordReset, type AuthProblem } from '../../../lib/auth'
import { redirectIfSignedIn } from '../../../lib/guards'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_auth/forgot-password/')({
  beforeLoad: () => redirectIfSignedIn(),
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  usePageTitle('Reset your password')

  const [email, setEmail] = useState('')
  const [invalid, setInvalid] = useState<string | null>(null)
  const [problem, setProblem] = useState<AuthProblem | null>(null)
  const [busy, setBusy] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const address = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setInvalid('Enter your email address')
      return
    }
    setInvalid(null)
    setProblem(null)
    setBusy(true)
    try {
      await sendPasswordReset(address)
      setSentTo(address)
    } catch (error) {
      setProblem(describeAuthError(error))
    } finally {
      setBusy(false)
    }
  }

  if (sentTo) {
    return (
      <>
        <div className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent-fg">
          <EnvelopeSimpleIcon className="size-6" aria-hidden />
        </div>
        <h1 className="mt-5 text-h1">Check your email</h1>
        {/* worded so it never confirms whether an account exists for that address */}
        <p className="mt-2 text-body-lg text-fg-2">
          If an account exists for <span className="font-medium break-all text-fg">{sentTo}</span>, a link to choose
          a new password is on its way.
        </p>
        <div className="mt-8 flex flex-col gap-2">
          <Link to="/sign-in" className={buttonClass({ block: true })}>
            Back to sign in
          </Link>
          <Button variant="ghost" block onClick={() => setSentTo(null)}>
            Use a different email
          </Button>
        </div>
        <p className="mt-6 text-small text-fg-3">Nothing after a few minutes? Check your spam folder.</p>
      </>
    )
  }

  return (
    <>
      <h1 className="text-h1">Reset your password</h1>
      <p className="mt-1 text-body-lg text-fg-2">Enter your email and we&rsquo;ll send a link to choose a new one.</p>

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
          error={invalid ?? (problem?.field === 'email' ? problem.title : null)}
        />
        <Button type="submit" block loading={busy} className="mt-2">
          Send reset link
        </Button>
      </form>

      <Link
        to="/sign-in"
        className="mt-8 inline-flex items-center gap-1.5 rounded font-medium text-accent-fg hover:underline"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Back to sign in
      </Link>
    </>
  )
}
