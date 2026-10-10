import { GithubLogoIcon, GoogleLogoIcon } from '@phosphor-icons/react'
import { Button } from './ui/Button'

export type SocialProvider = 'google' | 'github'

interface SocialButtonsProps {
  onChoose: (provider: SocialProvider) => void
  /** the one whose pop-up is open right now, if any */
  loading: SocialProvider | null
  /** true while any sign-in is under way, so nothing else can be started */
  disabled: boolean
}

/** "or", then the Google and GitHub buttons. Shared by the sign-in and register pages. */
export function SocialButtons({ onChoose, loading, disabled }: SocialButtonsProps) {
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-caption text-fg-3" role="separator">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-2">
        <Button
          variant="secondary"
          block
          onClick={() => onChoose('google')}
          loading={loading === 'google'}
          disabled={disabled}
          icon={<GoogleLogoIcon className="size-4.5" weight="bold" aria-hidden />}
        >
          Continue with Google
        </Button>
        <Button
          variant="secondary"
          block
          onClick={() => onChoose('github')}
          loading={loading === 'github'}
          disabled={disabled}
          icon={<GithubLogoIcon className="size-4.5" weight="fill" aria-hidden />}
        >
          Continue with GitHub
        </Button>
      </div>
    </>
  )
}
