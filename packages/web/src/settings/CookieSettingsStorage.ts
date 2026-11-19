import type { SettingsStorage } from './SettingsStorage';

const COOKIE_NAME = 'instrument_settings';
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/** Keeps the settings in a cookie for one week. Only this class touches document.cookie. */
export class CookieSettingsStorage implements SettingsStorage {
  load(): string | null {
    const prefix = `${COOKIE_NAME}=`;
    const entry = document.cookie.split('; ').find((c) => c.startsWith(prefix));
    return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
  }

  save(value: string): void {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${COOKIE_NAME}=${encodeURIComponent(value)}` +
      `; Max-Age=${MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
  }
}