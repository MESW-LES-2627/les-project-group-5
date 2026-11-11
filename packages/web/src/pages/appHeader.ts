/** Which page is open, so the header can mark its link as active. */
export type CurrentPage = 'instrument' | 'settings' | 'sign-up';

/**
 * The top bar shared by every page (brand on the left, navigation on the right), as in the layout template.
 * It lives in one place so the pages can't drift apart.
 */
export function appHeader(current: CurrentPage): string {
  return `
    <header class="app-header">
      <a class="brand" href="#/">Web-based Gesture Instrument</a>
      <nav aria-label="Main navigation">
        <a href="#/" class="${active(current, 'instrument')}" ${ariaCurrent(current, 'instrument')}>Instrument</a>
        <!-- The Game page is not available yet. -->
        <button type="button" disabled title="Coming soon">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M8.5 8h7a5 5 0 0 1 4.8 3.6l1.1 4a2.8 2.8 0 0 1-4.7 2.8L14.8 16H9.2l-1.9 2.4a2.8 2.8 0 0 1-4.7-2.8l1.1-4A5 5 0 0 1 8.5 8Z" /><path d="M7 12v4M5 14h4M17 13h.01M19 15h.01" /></svg>
          Game
        </button>
        <a href="#/settings" class="${active(current, 'settings')}" ${ariaCurrent(current, 'settings')}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M4 6h16M4 18h16M8 3v6M16 15v6" /><circle cx="8" cy="6" r="2" /><circle cx="16" cy="18" r="2" /></svg>
          Settings
        </a>
        <a href="#/sign-up" class="${active(current, 'sign-up')}" ${ariaCurrent(current, 'sign-up')}>Sign up</a>
      </nav>
    </header>`;
}

function active(current: CurrentPage, page: CurrentPage): string {
  return current === page ? 'active' : '';
}

function ariaCurrent(current: CurrentPage, page: CurrentPage): string {
  return current === page ? 'aria-current="page"' : '';
}
