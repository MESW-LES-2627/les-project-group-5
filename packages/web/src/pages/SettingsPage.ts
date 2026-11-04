import type { Handedness } from '@instrument/domain';
import { appHeader } from './appHeader';

/** The settings screen. It only draws the choices and reports changes; it doesn't store anything. */
export class SettingsPage {
  private readonly handSelector: HTMLElement;
  private readonly cameraPreviewInput: HTMLInputElement;
  private readonly serverStatus: HTMLElement;

  constructor(root: HTMLElement) {
    // The hand choice uses real radio buttons styled as the template's two-button switch,
    // so the keyboard and screen readers keep working without extra code.
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader('settings')}
        <main class="settings-page">
          <div class="settings-heading">
            <a class="back-button" href="#/" aria-label="Back to instrument">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="m15 18-6-6 6-6" /></svg>
            </a>
            <div>
              <p>Customize your setup</p>
              <h1>Settings</h1>
            </div>
            <span class="status-light server-status">Server: checking…</span>
          </div>
          <div class="settings-panel">
            <section>
              <div class="section-title">
                <h2>Dominant hand</h2>
                <p>Choose which hand controls the instrument.</p>
              </div>
              <fieldset class="segmented hand-selector">
                <legend class="visually-hidden">Hand</legend>
                <label><input type="radio" name="hand" value="Right" checked><span>Right hand</span></label>
                <label><input type="radio" name="hand" value="Left"><span>Left hand</span></label>
              </fieldset>
            </section>
            <section>
              <div class="section-title">
                <h2>Camera preview</h2>
                <p>Choose whether the camera image shows behind the cells.</p>
              </div>
              <label class="toggle">
                <input type="checkbox" name="preview" checked>
                <span>Show camera preview</span>
              </label>
            </section>
          </div>
          <a class="done-button" href="#/">Done</a>
        </main>
      </div>`;
    this.handSelector = find(root, '.hand-selector');
    this.cameraPreviewInput = find(root, '.toggle input[type="checkbox"]');
    this.serverStatus = find(root, '.server-status');
  }

  setServerStatus(online: boolean): void {
    this.serverStatus.textContent = online ? 'Server: online' : 'Server: offline';
    this.serverStatus.classList.toggle('online', online);
  }

  /** Reports a hand choice made by the user. */
  onHandChange(handler: (hand: Handedness) => void): void {
    this.handSelector.addEventListener('change', (event) => {
      const value = (event.target as HTMLInputElement).value;
      if (value !== 'Left' && value !== 'Right') return;
      handler(value);
    });
  }

  /** Reports a camera preview choice made by the user. */
  onCameraPreviewChange(handler: (visible: boolean) => void): void {
    this.cameraPreviewInput.addEventListener('change', () => handler(this.cameraPreviewInput.checked));
  }

  /** Shows which hand is selected. */
  setHand(hand: Handedness): void {
    const input = this.handSelector.querySelector<HTMLInputElement>(`input[value="${hand}"]`);
    if (input) input.checked = true;
  }

  /** Shows whether the camera preview is selected. */
  setCameraPreview(visible: boolean): void {
    this.cameraPreviewInput.checked = visible;
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`SettingsPage: missing element ${selector}`);
  return element;
}
