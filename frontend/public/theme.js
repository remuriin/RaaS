// Applies the saved theme before the first paint, so the page never flashes the wrong one.
// A separate file rather than an inline script, so the page's Content-Security-Policy can stay "script-src 'self'".
try {
  if (localStorage.getItem('raas-theme') === 'light') document.documentElement.dataset.theme = 'light'
} catch {
  // a private window may refuse storage; the page then simply starts dark
}
