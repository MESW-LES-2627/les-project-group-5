import type { ConfirmEmailAnswer } from '../api/ApiClient';
import { appHeader } from './appHeader';

/** The texts from US-E1-02, for each answer of the server. */
const MESSAGES: Record<Exclude<ConfirmEmailAnswer, 'confirmed'>, string> = {
  // The way to get a new link comes with "Resend the confirmation email" (US-E1-03).
  expired: 'This link has expired.',
  invalid: 'This link is invalid or has already been used.',
  failed: 'Something went wrong. Check your connection and try again.',
};

/**
 * The page opened from the confirmation email (US-E1-02). It does not confirm on its own:
 * the person has to click the button, because some email providers open links by themselves to scan them.
 * It only shows the button and the result; the token and the request come from the handler.
 */
export class ConfirmEmailPage {
  private readonly intro: HTMLElement;
  private readonly confirmButton: HTMLButtonElement;
  private readonly message: HTMLElement;
  private readonly loginLink: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader(null)}
        <main class="settings-page account-page">
          <div class="settings-heading">
            <div>
              <p>Almost there</p>
              <h1>Confirm your email</h1>
            </div>
          </div>
          <div class="settings-panel account-panel account-form">
            <p class="confirm-intro">Click the button to activate your account.</p>
            <button type="button" class="done-button confirm-button">Confirm my email</button>
            <p class="sent-message confirm-message" role="status"></p>
            <a class="done-button login-link" href="#/login" hidden>Log in</a>
          </div>
        </main>
      </div>`;
    this.intro = find(root, '.confirm-intro');
    this.confirmButton = find(root, '.confirm-button');
    this.message = find(root, '.confirm-message');
    this.loginLink = find(root, '.login-link');
  }

  /** Shows the button again, for a new link opened in the same tab. */
  reset(): void {
    this.intro.hidden = false;
    this.confirmButton.hidden = false;
    this.confirmButton.disabled = false;
    this.message.textContent = '';
    this.loginLink.hidden = true;
  }

  /** Calls the handler when the button is clicked, and shows its answer. */
  onConfirm(handler: () => Promise<ConfirmEmailAnswer>): void {
    this.confirmButton.addEventListener('click', async () => {
      this.confirmButton.disabled = true;
      const answer = await handler();
      if (answer === 'failed') {
        // Nothing was used up, so the same link can be tried again.
        this.confirmButton.disabled = false;
        this.message.textContent = MESSAGES.failed;
        return;
      }
      this.intro.hidden = true;
      this.confirmButton.hidden = true;
      if (answer === 'confirmed') {
        this.message.textContent = 'Email confirmed. You can now log in.';
        this.loginLink.hidden = false;
      } else {
        this.message.textContent = MESSAGES[answer];
      }
    });
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
