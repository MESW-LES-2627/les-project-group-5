import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type PasswordProblem } from '@instrument/domain';
import type { ResetPasswordAnswer } from '../api/ApiClient';
import { appHeader } from './appHeader';

const PASSWORD_ERRORS: Record<PasswordProblem, string> = {
  'too-short': `Use at least ${PASSWORD_MIN_LENGTH} characters.`,
  'too-long': `Use at most ${PASSWORD_MAX_LENGTH} characters.`,
};
const INVALID_LINK_MESSAGE = 'This reset link is invalid or has expired.';
const FAILED_MESSAGE = 'Something went wrong. Check your connection and try again.';

/** The page opened from a password reset email (US-E1-07). */
export class ResetPasswordPage {
  private readonly form: HTMLFormElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly passwordError: HTMLElement;
  private readonly formMessage: HTMLElement;
  private readonly invalidMessage: HTMLElement;
  private readonly sentMessage: HTMLElement;
  private readonly loginLink: HTMLAnchorElement;
  private readonly requestLink: HTMLAnchorElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader(null)}
        <main class="settings-page account-page">
          <div class="settings-heading">
            <div>
              <p>Choose a new password</p>
              <h1>Reset your password</h1>
            </div>
          </div>
          <div class="settings-panel account-panel">
            <form class="account-form" novalidate>
              <p class="confirm-intro">Choose a password with ${PASSWORD_MIN_LENGTH} to ${PASSWORD_MAX_LENGTH} characters.</p>
              <div class="field">
                <label for="reset-password">New password</label>
                <input type="password" id="reset-password" name="password" autocomplete="new-password"
                  aria-describedby="reset-password-error" required>
                <small class="field-error" id="reset-password-error" role="alert"></small>
              </div>
              <p class="form-message" role="alert"></p>
              <button type="submit" class="done-button">Change password</button>
            </form>
            <p class="form-message invalid-message" role="alert" hidden></p>
            <p class="sent-message" role="status" hidden></p>
            <a class="done-button login-link" href="#/login" hidden>Log in</a>
            <a class="form-footer request-link" href="#/forgot-password" hidden>Request a new reset link</a>
          </div>
        </main>
      </div>`;
    this.form = find(root, '.account-form');
    this.passwordInput = find(root, 'input[name="password"]');
    this.submitButton = find(root, 'button[type="submit"]');
    this.passwordError = find(root, '#reset-password-error');
    this.formMessage = find(root, '.form-message');
    this.invalidMessage = find(root, '.invalid-message');
    this.sentMessage = find(root, '.sent-message');
    this.loginLink = find(root, '.login-link');
    this.requestLink = find(root, '.request-link');
  }

  /** Clears passwords and results before showing a reset link in this tab. */
  reset(): void {
    this.form.reset();
    this.form.hidden = false;
    this.passwordInput.setAttribute('aria-invalid', 'false');
    this.passwordError.textContent = '';
    this.formMessage.textContent = '';
    this.invalidMessage.textContent = '';
    this.invalidMessage.hidden = true;
    this.sentMessage.hidden = true;
    this.loginLink.hidden = true;
    this.requestLink.hidden = true;
  }

  /** Submits the new password for the token in the current reset link. */
  onSubmit(handler: (password: string) => Promise<ResetPasswordAnswer>): void {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.passwordError.textContent = '';
      this.passwordInput.setAttribute('aria-invalid', 'false');
      this.formMessage.textContent = '';
      this.submitButton.disabled = true;

      const answer = await handler(this.passwordInput.value);
      this.submitButton.disabled = false;
      if (answer.kind === 'changed') {
        this.form.reset();
        this.form.hidden = true;
        this.sentMessage.textContent = 'Password changed. Please log in.';
        this.sentMessage.hidden = false;
        this.loginLink.hidden = false;
      } else if (answer.kind === 'invalid-link') {
        this.form.hidden = true;
        this.invalidMessage.textContent = INVALID_LINK_MESSAGE;
        this.invalidMessage.hidden = false;
        this.requestLink.hidden = false;
      } else if (answer.kind === 'rejected') {
        this.passwordError.textContent = PASSWORD_ERRORS[answer.errors.password];
        this.passwordInput.setAttribute('aria-invalid', 'true');
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
