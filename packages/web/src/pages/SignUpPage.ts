import {
  checkPassword,
  isValidEmail,
  normalizeEmail,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  type PasswordProblem,
} from '@instrument/domain';
import type { SignUpAnswer, SignUpErrors } from '../api/ApiClient';
import { appHeader } from './appHeader';

/** The exact text from US-E1-01. The same whether or not the email already had an account. */
const SENT_MESSAGE = "Check your inbox. If this email can be used, we've sent you a confirmation link.";
const EMAIL_ERROR = 'Enter a valid email address, like name@example.com.';
const PASSWORD_ERRORS: Record<PasswordProblem, string> = {
  'too-short': `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  'too-long': `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
};
const FAILED_MESSAGE = 'Something went wrong. Check your connection and try again.';

/**
 * The sign-up screen (US-E1-01). It checks the fields with the same rules as the server, to show errors
 * right away, then hands the email and password to the handler and shows the answer. It stores nothing.
 */
export class SignUpPage {
  private readonly form: HTMLFormElement;
  private readonly emailInput: HTMLInputElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly showPasswordButton: HTMLButtonElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly emailError: HTMLElement;
  private readonly passwordError: HTMLElement;
  private readonly formMessage: HTMLElement;
  private readonly sentMessage: HTMLElement;

  constructor(root: HTMLElement) {
    // novalidate: we show our own field errors, with the same rules as the server, instead of the browser's.
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader('sign-up')}
        <main class="settings-page account-page">
          <div class="settings-heading">
            <a class="back-button" href="#/" aria-label="Back to instrument">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="m15 18-6-6 6-6" /></svg>
            </a>
            <div>
              <p>Save your settings and progress</p>
              <h1>Sign up</h1>
            </div>
          </div>
          <div class="settings-panel account-panel">
            <form class="account-form" novalidate>
              <div class="field">
                <label for="sign-up-email">Email</label>
                <input type="email" id="sign-up-email" name="email" autocomplete="email" aria-describedby="sign-up-email-error" required>
                <small class="field-error" id="sign-up-email-error" role="alert"></small>
              </div>
              <div class="field">
                <label for="sign-up-password">Password</label>
                <div class="password-row">
                  <input type="password" id="sign-up-password" name="password" autocomplete="new-password"
                    aria-describedby="sign-up-password-hint sign-up-password-error" required>
                  <button type="button" class="show-password" aria-pressed="false">Show</button>
                </div>
                <small class="field-hint" id="sign-up-password-hint">${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.</small>
                <small class="field-error" id="sign-up-password-error" role="alert"></small>
              </div>
              <p class="form-message" role="alert"></p>
              <button type="submit" class="done-button">Create account</button>
            </form>
            <p class="sent-message" role="status" hidden></p>
          </div>
        </main>
      </div>`;
    this.form = find(root, '.account-form');
    this.emailInput = find(root, 'input[name="email"]');
    this.passwordInput = find(root, 'input[name="password"]');
    this.showPasswordButton = find(root, '.show-password');
    this.submitButton = find(root, 'button[type="submit"]');
    this.emailError = find(root, '#sign-up-email-error');
    this.passwordError = find(root, '#sign-up-password-error');
    this.formMessage = find(root, '.form-message');
    this.sentMessage = find(root, '.sent-message');

    // Show/hide toggle (US-E1-01): switching the input type keeps what was typed.
    this.showPasswordButton.addEventListener('click', () => {
      const show = this.passwordInput.type === 'password';
      this.passwordInput.type = show ? 'text' : 'password';
      this.showPasswordButton.textContent = show ? 'Hide' : 'Show';
      this.showPasswordButton.setAttribute('aria-pressed', String(show));
    });
  }

  /** Calls the handler with a valid email and password, and shows what it answers. */
  onSubmit(handler: (email: string, password: string) => Promise<SignUpAnswer>): void {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const email = normalizeEmail(this.emailInput.value);
      const password = this.passwordInput.value;
      const errors: SignUpErrors = {};
      if (!isValidEmail(email)) errors.email = 'invalid-format';
      const passwordProblem = checkPassword(password);
      if (passwordProblem) errors.password = passwordProblem;
      this.showErrors(errors);
      if (errors.email || errors.password) return;

      this.submitButton.disabled = true;
      const answer = await handler(email, password);
      this.submitButton.disabled = false;
      if (answer.kind === 'sent') this.showSent();
      else if (answer.kind === 'rejected') this.showErrors(answer.errors);
      else this.formMessage.textContent = FAILED_MESSAGE;
    });
  }

  private showErrors(errors: SignUpErrors): void {
    this.emailError.textContent = errors.email ? EMAIL_ERROR : '';
    this.passwordError.textContent = errors.password ? PASSWORD_ERRORS[errors.password] : '';
    this.emailInput.setAttribute('aria-invalid', String(Boolean(errors.email)));
    this.passwordInput.setAttribute('aria-invalid', String(Boolean(errors.password)));
    this.formMessage.textContent = '';
  }

  /** Replaces the form with the message, and forgets the password typed. */
  private showSent(): void {
    this.form.reset();
    this.form.hidden = true;
    this.sentMessage.textContent = SENT_MESSAGE;
    this.sentMessage.hidden = false;
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
