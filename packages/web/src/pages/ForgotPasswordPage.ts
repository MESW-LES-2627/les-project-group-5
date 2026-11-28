import type { PasswordResetRequestAnswer } from '../api/ApiClient';
import { appHeader } from './appHeader';

const SENT_MESSAGE = "If an account exists for this email, we've sent a reset link.";
const FAILED_MESSAGE = 'Something went wrong. Check your connection and try again.';

/** The password-reset request screen (US-E1-06). It never validates or reveals whether an account exists. */
export class ForgotPasswordPage {
  private readonly form: HTMLFormElement;
  private readonly emailInput: HTMLInputElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly formMessage: HTMLElement;
  private readonly sentMessage: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader(null)}
        <main class="settings-page account-page">
          <div class="settings-heading">
            <a class="back-button" href="#/login" aria-label="Back to log in">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="m15 18-6-6 6-6" /></svg>
            </a>
            <div>
              <p>Get back into your account</p>
              <h1>Reset your password</h1>
            </div>
          </div>
          <div class="settings-panel account-panel">
            <form class="account-form" novalidate>
              <p class="confirm-intro">Enter your email and we'll send a password reset link if an account exists.</p>
              <div class="field">
                <label for="forgot-password-email">Email</label>
                <input type="email" id="forgot-password-email" name="email" autocomplete="email" required>
              </div>
              <p class="form-message" role="alert"></p>
              <button type="submit" class="done-button">Send reset link</button>
            </form>
            <p class="sent-message" role="status" hidden></p>
          </div>
        </main>
      </div>`;
    this.form = find(root, '.account-form');
    this.emailInput = find(root, 'input[name="email"]');
    this.submitButton = find(root, 'button[type="submit"]');
    this.formMessage = find(root, '.form-message');
    this.sentMessage = find(root, '.sent-message');
  }

  /** Clears the result and shows the empty form again for a new visit. */
  reset(): void {
    this.form.reset();
    this.form.hidden = false;
    this.formMessage.textContent = '';
    this.sentMessage.hidden = true;
  }

  /** Submits any entered email and shows the same response regardless of account state. */
  onSubmit(handler: (email: string) => Promise<PasswordResetRequestAnswer>): void {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.formMessage.textContent = '';
      this.submitButton.disabled = true;
      const answer = await handler(this.emailInput.value);
      this.submitButton.disabled = false;
      if (answer === 'sent') {
        this.form.hidden = true;
        this.sentMessage.textContent = SENT_MESSAGE;
        this.sentMessage.hidden = false;
      } else {
        this.formMessage.textContent = FAILED_MESSAGE;
      }
    });
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
