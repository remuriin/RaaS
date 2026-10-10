import { Link, Outlet, createFileRoute } from '@tanstack/react-router'
import sheetsLight from '../../assets/auth-sheets-light.webp'
import sheetsDark from '../../assets/auth-sheets.webp'
import { Logo } from '../../components/Logo'
import { Picture } from '../../components/Picture'
import { ThemeToggle } from '../../components/ThemeToggle'
import { useTheme } from '../../lib/theme'

// The "_" makes this folder pathless: it wraps the sign-in pages without adding to their address.
export const Route = createFileRoute('/_auth')({
  component: AuthLayout,
})

// The outline of each sheet in the picture, in percent of its width and height. The picture is one photo,
// so a sheet lights up by showing a copy of the photo cut to that sheet's outline, on top of the original.
// The dark and the light picture are the same sheets in the same places, so one set of outlines serves both.
const SHEETS = [
  '3.8% 7.1%, 19.9% 10.1%, 19.9% 64.9%, 9.3% 71%, 3.1% 50.7%',
  '19.9% 5.1%, 29% 6.6%, 29.7% 60.9%, 19.9% 64.9%',
  '29% 1%, 42.2% 3%, 44% 15.2%, 52.9% 56.8%, 29.7% 60.9%',
  '43.3% 1%, 71.9% 9.1%, 81.5% 33.5%, 98.5% 60.9%, 77.4% 57.8%, 63.8% 47.7%, 52.9% 30.4%, 44% 15.2%',
  '10.6% 71%, 52.9% 56.8%, 78.7% 62.9%, 82.8% 72%, 78.7% 80.1%, 70.6% 87.2%, 78.1% 98.9%, 21.5% 82.2%',
]

function AuthLayout() {
  const sheets = useTheme() === 'dark' ? sheetsDark : sheetsLight

  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <div className="flex flex-col px-4 py-5 sm:px-8">
        <header className="flex items-center justify-between">
          <Link to="/" className="rounded-lg">
            <Logo />
          </Link>
          <ThemeToggle />
        </header>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="glass w-full max-w-md animate-rise rounded-2xl border border-line p-6 sm:p-8">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Only on wide screens. The picture is decoration, so it is hidden from screen readers. */}
      <aside className="relative hidden flex-col overflow-hidden border-l border-line lg:flex" aria-hidden>
        <div className="flex min-h-0 flex-1 items-center justify-center px-10 pt-8">
          <div className="relative aspect-[734/986] h-full max-h-[min(44rem,calc(100dvh-17rem))] max-w-full">
            <Picture dark={sheetsDark} light={sheetsLight} alt="" width={734} height={986} className="size-full" decoding="async" />
            {SHEETS.map((outline) => (
              // the sheet under the pointer changes tone a touch (brighter in the dark, deeper on white), then settles back.
              // hidden at rest: two see-through copies on top of each other would show the outline
              <div
                key={outline}
                className="absolute inset-0 bg-size-[100%_100%] opacity-0 transition-[filter,opacity] duration-500 ease-out hover:opacity-100 hover:brightness-110 not-dark:hover:brightness-95"
                style={{ backgroundImage: `url(${sheets})`, clipPath: `polygon(${outline})` }}
              />
            ))}
          </div>
        </div>
        <div className="relative p-12">
          <p className="max-w-md text-h1">Your documents already hold the answers.</p>
          <p className="mt-3 max-w-sm text-body-lg text-fg-2">
            Upload them once and every question your app asks is answered from them, with the source attached.
          </p>
        </div>
      </aside>
    </div>
  )
}
