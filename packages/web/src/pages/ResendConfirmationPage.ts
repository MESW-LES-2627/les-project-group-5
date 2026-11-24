import { isValidEmail, normalizeEmail } from '@instrument/domain';
import type { ResendConfirmationAnswer } from '../api/ApiClient';
import { appHeader } from './appHeader';

/** The exact text from US-E1-03. The same whether or not an email was sent. */
const SENT_MESSAGE = "If this email has an unconfirmed account, we've sent a new link.";
const EMAIL_ERROR = 'Enter a valid email address, like name@example.com.';
const FAILED_MESSAGE = 'Something went wrong. Check your connection and try again.';

/**
 * The "Didn't get the email?" screen (US-E1-03). It asks only for the email, hands it to the handler
 * and shows the same message whatever the account's state, so the page never tells who has an account.
 */
export class ResendConfirmationPage {
  private readonly form: HTMLFormElement;
  private readonly emailInput: HTMLInputElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly emailError: HTMLElement;
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
              <p>Didn't get the email?</p>
              <h1>Send a new link</h1>
            </div>
          </div>
          <div class="settings-panel account-panel">
            <form class="account-form" novalidate>
              <p class="confirm-intro">Enter the email you signed up with. Any older link stops working.</p>
              <div class="field">
                <label for="resend-email">Email</label>
                <input type="email" id="resend-email" name="email" autocomplete="email" aria-describedby="resend-email-error" required>
                <small class="field-error" id="resend-email-error" role="alert"></small>
              </div>
              <p class="form-message" role="alert"></p>
              <button type="submit" class="done-button">Send a new link</button>
            </form>
            <p class="sent-message" role="status" hidden></p>
          </div>
        </main>
      </div>`;
    this.form = find(root, '.account-form');
    this.emailInput = find(root, 'input[name="email"]');
    this.submitButton = find(root, 'button[type="submit"]');
    this.emailError = find(root, '#resend-email-error');
    this.formMessage = find(root, '.form-message');
    this.sentMessage = find(root, '.sent-message');
  }

  /** Shows the empty form again, for a new visit to the page. */
  reset(): void {
    this.form.reset();
    this.form.hidden = false;
    this.showEmailError(false);
    this.formMessage.textContent = '';
    this.sentMessage.hidden = true;
  }

  /** Calls the handler with a valid email, and shows what it answers. */
  onSubmit(handler: (email: string) => Promise<ResendConfirmationAnswer>): void {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = normalizeEmail(this.emailInput.value);
      this.formMessage.textContent = '';
      this.showEmailError(!isValidEmail(email));
      if (!isValidEmail(email)) return;

      // The server always takes a few seconds (so its timing reveals nothing): stop double clicks meanwhile.
      this.submitButton.disabled = true;
      const answer = await handler(email);
      this.submitButton.disabled = false;
      if (answer === 'sent') {
        this.form.hidden = true;
        this.sentMessage.textContent = SENT_MESSAGE;
        this.sentMessage.hidden = false;
      } else if (answer === 'invalid-email') {
        this.showEmailError(true);
      } else {
        this.formMessage.textContent = FAILED_MESSAGE;
      }
    });
  }

  private showEmailError(show: boolean): void {
    this.emailError.textContent = show ? EMAIL_ERROR : '';
    this.emailInput.setAttribute('aria-invalid', String(show));
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
