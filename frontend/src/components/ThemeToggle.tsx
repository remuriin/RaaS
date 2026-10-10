import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { cx } from '../lib/cx'
import { setTheme, useTheme } from '../lib/theme'

/** Switches between the dark and the light theme. The choice is remembered on this device. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const Icon = theme === 'dark' ? SunIcon : MoonIcon
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cx(
        'grid size-9 shrink-0 place-items-center rounded-lg text-fg-2 transition-colors hover:bg-raised hover:text-fg pointer-coarse:size-11',
        className,
      )}
    >
      <Icon className="size-4.5" aria-hidden />
    </button>
  )
}
