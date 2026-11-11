import type { LogInAnswer } from '../api/ApiClient';
import { appHeader } from './appHeader';

/** The texts from US-E1-04 for each answer that keeps the person on this page. */
const MESSAGES: Record<Exclude<LogInAnswer['kind'], 'logged-in'>, string> = {
  invalid: 'Invalid email or password.',
  // The link to send the email again comes with "Resend the confirmation email" (US-E1-03).
  'not-confirmed': 'Please confirm your email first.',
  failed: 'Something went wrong. Check your connection and try again.',
};

/**
 * The login screen (US-E1-04). It does not check the password rules: a login only asks the server
 * whether the email and password match. It hands them to the handler and shows the answer.
 */
export class LoginPage {
  private readonly form: HTMLFormElement;
  private readonly emailInput: HTMLInputElement;
  private readonly passwordInput: HTMLInputElement;
  private readonly showPasswordButton: HTMLButtonElement;
  private readonly submitButton: HTMLButtonElement;
  private readonly formMessage: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader('login')}
        <main class="settings-page account-page">
          <div class="settings-heading">
            <a class="back-button" href="#/" aria-label="Back to instrument">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="m15 18-6-6 6-6" /></svg>
            </a>
            <div>
              <p>Load your saved settings</p>
              <h1>Log in</h1>
            </div>
          </div>
          <div class="settings-panel account-panel">
            <form class="account-form" novalidate>
              <div class="field">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" name="email" autocomplete="email" required>
              </div>
              <div class="field">
                <label for="login-password">Password</label>
                <div class="password-row">
                  <input type="password" id="login-password" name="password" autocomplete="current-password" required>
                  <button type="button" class="show-password" aria-pressed="false">Show</button>
                </div>
              </div>
              <p class="form-message" role="alert"></p>
              <button type="submit" class="done-button">Log in</button>
              <p class="form-footer">No account yet? <a href="#/sign-up">Sign up</a></p>
            </form>
          </div>
        </main>
      </div>`;
    this.form = find(root, '.account-form');
    this.emailInput = find(root, 'input[name="email"]');
    this.passwordInput = find(root, 'input[name="password"]');
    this.showPasswordButton = find(root, '.show-password');
    this.submitButton = find(root, 'button[type="submit"]');
    this.formMessage = find(root, '.form-message');

    this.showPasswordButton.addEventListener('click', () => {
      const show = this.passwordInput.type === 'password';
      this.passwordInput.type = show ? 'text' : 'password';
      this.showPasswordButton.textContent = show ? 'Hide' : 'Show';
      this.showPasswordButton.setAttribute('aria-pressed', String(show));
    });
  }

  /** Calls the handler with the email and password, and shows the message if the login did not succeed. */
  onSubmit(handler: (email: string, password: string) => Promise<LogInAnswer>): void {
    this.form.addEventListener('submit', async (event) => {
      event.preventDefault();
      this.formMessage.textContent = '';
      this.submitButton.disabled = true;
      const answer = await handler(this.emailInput.value, this.passwordInput.value);
      this.submitButton.disabled = false;
      if (answer.kind === 'logged-in') {
        // Forget the password typed, so it isn't there after logging out.
        this.form.reset();
        return;
      }
      this.formMessage.textContent = MESSAGES[answer.kind];
      this.passwordInput.value = '';
    });
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing ${selector}`);
  return element;
}
