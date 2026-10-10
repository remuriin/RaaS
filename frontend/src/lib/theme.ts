import { createStore, useStore } from './store'

export type Theme = 'dark' | 'light'

const STORAGE_KEY = 'raas-theme'
const CANVAS: Record<Theme, string> = { dark: '#0a0a0a', light: '#fafafa' }

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
}

// index.html has already applied the saved theme before this file runs
const themeStore = createStore<Theme>(currentTheme())

export function setTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', CANVAS[theme])
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // private windows can refuse storage; the theme still applies for this visit
  }
  themeStore.set(theme)
}

export function useTheme(): Theme {
  return useStore(themeStore)
}
