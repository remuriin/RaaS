const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const numberFormat = new Intl.NumberFormat('en-US')
const relativeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** "9 Oct 2026"; a date the server got wrong shows as a dash instead of breaking the page */
export function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '–' : dateFormat.format(date)
}

/** "2 minutes ago" for the last day, the plain date after that. */
export function formatWhen(iso: string): string {
  if (Number.isNaN(new Date(iso).getTime())) return '–'
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const age = Math.abs(seconds)
  if (age < 45) return 'just now'
  if (age < 3600) return relativeFormat.format(Math.round(seconds / 60), 'minute')
  if (age < 86400) return relativeFormat.format(Math.round(seconds / 3600), 'hour')
  return formatDate(iso)
}

/** "1,204" */
export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/** "1 file", "8 files". Pass the plural when adding an "s" is not enough: plural(7, 'query', 'queries') */
export function plural(count: number, word: string, many = `${word}s`): string {
  return `${formatNumber(count)} ${count === 1 ? word : many}`
}

/** "412 KB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  return `${Math.round(bytes / 1024)} KB`
}

/** The address without "https://", for places where space is tight. */
export function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, '')
}
