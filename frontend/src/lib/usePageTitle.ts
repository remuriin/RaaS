import { useEffect } from 'react'

/** Sets the browser tab's title for as long as the page is shown. */
export function usePageTitle(title?: string | null): void {
  useEffect(() => {
    document.title = title ? `${title} · Rem RaaS` : 'Rem RaaS'
  }, [title])
}
