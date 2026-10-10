import { EnvelopeSimpleIcon } from '@phosphor-icons/react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Alert } from '../../../components/ui/Alert'
import { Button } from '../../../components/ui/Button'
import { describeAuthError, refreshUser, resendVerification, signOutUser, useAuth } from '../../../lib/auth'
import { requireUnverifiedUser } from '../../../lib/guards'
import { usePageTitle } from '../../../lib/usePageTitle'

export const Route = createFileRoute('/_auth/verify-email/')({
  beforeLoad: () => requireUnverifiedUser(),
  component: VerifyEmailPage,
})

const RESEND_WAIT = 60 // seconds between two emails

function VerifyEmailPage() {
  usePageTitle('Verify your email')
  const { user } = useAuth()
  const navigate = useNavigate()

  const [checking, setChecking] = useState(false)
  const [sending, setSending] = useState(false)
  const [wait, setWait] = useState(0)
  const [message, setMessage] = useState<{ tone: 'success' | 'warning' | 'danger'; title: string; detail?: string } | null>(
    null,
  )

  // The link is usually opened in another tab, so this page keeps asking Firebase whether it happened
  // (every 15 seconds, and whenever the tab comes back into view).
  // The moment it has, the route's own login check runs again and moves on to the dashboard.
  useEffect(() => {
    const check = () => {
      if (document.visibilityState === 'visible') void refreshUser().catch(() => undefined)
    }
    const interval = window.setInterval(check, 15000)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])

  // counts the resend button's waiting time down to zero
  useEffect(() => {
    if (wait <= 0) return
    const timer = window.setTimeout(() => setWait((seconds) => seconds - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [wait])

  async function checkNow() {
    setChecking(true)
    setMessage(null)
    try {
      const latest = await refreshUser()
      if (latest?.emailVerified) {
        await navigate({ to: '/services', replace: true })
        return
      }
      setMessage({ tone: 'warning', title: 'Not verified yet', detail: 'Open the link in the email first, then try again.' })
    } catch (error) {
      const problem = describeAuthError(error)
      if (problem) setMessage({ tone: 'danger', ...problem })
    } finally {
      setChecking(false)
    }
  }

  async function resend() {
    setSending(true)
    setMessage(null)
    try {
      await resendVerification()
      setWait(RESEND_WAIT)
      setMessage({ tone: 'success', title: 'Email sent', detail: 'It can take a minute to arrive.' })
    } catch (error) {
      const problem = describeAuthError(error)
      if (problem) setMessage({ tone: 'danger', ...problem })
    } finally {
      setSending(false)
    }
  }

  async function startOver() {
    await signOutUser()
    await navigate({ to: '/register', replace: true })
  }

  return (
    <>
      <div className="grid size-12 place-items-center rounded-full bg-accent-subtle text-accent-fg">
        <EnvelopeSimpleIcon className="size-6" aria-hidden />
      </div>
      <h1 className="mt-5 text-h1">Verify your email</h1>
      {user?.email ? (
        <p className="mt-2 text-body-lg text-fg-2">
          We sent a link to <span className="font-medium break-all text-fg">{user.email}</span>. Open it to finish
          creating your account.
        </p>
      ) : (
        <p className="mt-2 text-body-lg text-fg-2">
          The account you signed in with didn&rsquo;t share an email address, so there is nothing to send a link
          to. Add a verified email to that account, or sign in another way.
        </p>
      )}

      {message && (
        <Alert tone={message.tone} title={message.title} className="mt-6">
          {message.detail}
        </Alert>
      )}

      <div className="mt-8 flex flex-col gap-2">
        <Button block onClick={checkNow} loading={checking}>
          I&rsquo;ve opened the link
        </Button>
        <Button variant="secondary" block onClick={resend} loading={sending} disabled={wait > 0}>
          {wait > 0 ? `Resend in ${wait}s` : 'Resend email'}
        </Button>
      </div>

      <p className="mt-6 text-small text-fg-3">
        Didn&rsquo;t get it? Check your spam folder. This page moves on by itself once the link is opened.
      </p>

      <button
        type="button"
        onClick={startOver}
        className="mt-8 rounded font-medium text-accent-fg hover:underline"
      >
        Use a different email
      </button>
    </>
  )
}
