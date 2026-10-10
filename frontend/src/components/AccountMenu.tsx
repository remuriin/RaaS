import { BookOpenIcon, ListIcon, MoonIcon, SignOutIcon, StackIcon, SunIcon } from '@phosphor-icons/react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { signOutUser, useAuth } from '../lib/auth'
import { setTheme, useTheme } from '../lib/theme'

const itemClass =
  'flex h-10 w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-fg-2 transition-colors hover:bg-raised-hover hover:text-fg pointer-coarse:h-11'

/**
 * The menu at the end of the dashboard's top bar. On a wide screen it opens from the account button
 * and holds the theme switch and "Sign out". On a phone it opens from a menu icon and also holds
 * the page links, since those don't fit in the bar.
 */
export function AccountMenu() {
  const { user } = useAuth()
  const theme = useTheme()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function leave() {
    setOpen(false)
    await signOutUser()
    await navigate({ to: '/sign-in' })
  }

  const email = user?.email ?? 'Account'
  const initial = email.charAt(0).toUpperCase()
  const ThemeIcon = theme === 'dark' ? SunIcon : MoonIcon

  return (
    <div
      ref={root}
      className="relative"
      // tabbing out of the menu closes it, so it never stays open over a page being used by keyboard
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 items-center gap-2.5 rounded-lg pr-1 pl-2 text-fg-2 transition-colors hover:bg-raised hover:text-fg pointer-coarse:h-11 md:pl-3"
      >
        <span className="hidden max-w-56 truncate text-small md:block">{email}</span>
        <span className="hidden size-8 place-items-center rounded-full border border-line-strong bg-raised text-caption text-fg md:grid">
          {initial}
        </span>
        <ListIcon className="size-5 md:hidden" aria-hidden />
      </button>

      {open && (
        <div className="absolute top-full right-0 z-40 mt-2 w-64 glass animate-pop rounded-xl border border-line-strong p-1.5 shadow-pop">
          <div className="border-b border-line px-2.5 pt-1.5 pb-2.5">
            <p className="text-caption text-fg-3">Signed in as</p>
            <p className="truncate text-fg" title={email}>
              {email}
            </p>
          </div>
          <div className="mt-1.5 md:hidden">
            <Link to="/services" className={itemClass} onClick={() => setOpen(false)}>
              <StackIcon className="size-4.5" aria-hidden />
              Services
            </Link>
            <Link to="/docs" className={itemClass} onClick={() => setOpen(false)}>
              <BookOpenIcon className="size-4.5" aria-hidden />
              Docs
            </Link>
          </div>
          <div className="mt-1.5">
            <button type="button" className={itemClass} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <ThemeIcon className="size-4.5" aria-hidden />
              {theme === 'dark' ? 'Light theme' : 'Dark theme'}
            </button>
            <button type="button" className={itemClass} onClick={leave}>
              <SignOutIcon className="size-4.5" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
