// Dark mode markup shared by generate-countries.mjs and generate-portal.mjs, so
// every page chooses its theme the same way. The switch's behaviour is in
// site/js/theme.js; the colours are the theme colours in styles.css and
// portal.css (see "Colours and dark mode" in the README).

// Runs in <head> before the page is drawn, so nobody sees the light page flash
// first: the visitor's own choice from the sun and moon switch (saved on their
// device) wins, otherwise their device's light or dark setting. 404.html
// (which no generator writes) carries a hand copy of this line.
export const THEME_SCRIPT = "<script>(function(){var t;try{t=localStorage.getItem('theme')}catch(e){}if(t!=='light'&&t!=='dark')t=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t)})()</script>";

// The sun and moon switch. `indent` is the indentation of the line it starts
// on, so it lines up with the markup around it. The hand-maintained pages
// carry the same button, written in by hand.
export function themeToggle(indent) {
  return [
    '<button type="button" class="theme-toggle" aria-pressed="false" title="Switch to dark mode">',
    '  <span class="sr-only">Dark mode</span>',
    '  <svg class="theme-toggle-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.5 14.2A8.5 8.5 0 0 1 9.8 3.5a8.5 8.5 0 1 0 10.7 10.7z"/></svg>',
    '  <svg class="theme-toggle-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
    '</button>',
  ].map((line, i) => (i === 0 ? line : indent + line)).join('\n');
}
