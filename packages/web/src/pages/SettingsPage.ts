import type { Handedness } from '@instrument/domain';

/** The settings screen. It only draws the choices and reports changes; it doesn't store anything. */
export class SettingsPage {
  private readonly handSelector: HTMLElement;
  private readonly cameraPreviewSelector: HTMLElement;
  private readonly serverStatus: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        <header class="app-header">
          <div class="brand">Web-based Gesture Instrument</div>
          <span class="server-status">Server: checking…</span>
          <nav aria-label="Main navigation">
            <a href="#/">Instrument</a>
            <button type="button" disabled title="Coming soon">Game</button>
            <a class="active" href="#/settings" aria-current="page">
              Settings
            </a>
          </nav>
        </header>
        <main class="settings-page">
          <div class="settings-heading">
            <a class="back-button" href="#/" aria-label="Back to instrument">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="m15 18-6-6 6-6" /></svg>
            </a>
            <div>
              <p>Customize your setup</p>
              <h1>Settings</h1>
            </div>
          </div>
          <div class="settings-panel">
            <section>
              <div class="section-title">
                <h2>Dominant hand</h2>
                <p>Choose which hand controls the instrument.</p>
              </div>
              <fieldset class="settings hand-selector">
                <legend class="visually-hidden">Hand</legend>
                <label><input type="radio" name="hand" value="Left"> Left hand</label>
                <label><input type="radio" name="hand" value="Right" checked> Right hand</label>
              </fieldset>
            </section>
            <section>
              <div class="section-title">
                <h2>Camera preview</h2>
                <p>Choose whether the camera image shows behind the cells.</p>
              </div>
              <fieldset class="settings toggle-setting preview-setting">
                <legend class="visually-hidden">Camera</legend>
                <label><input type="checkbox" name="preview" checked> Show camera preview</label>
              </fieldset>
            </section>
          </div>
          <a class="done-button" href="#/">Done</a>
        </main>
      </div>`;
    this.handSelector = find(root, '.hand-selector');
    this.cameraPreviewSelector = find(root, '.preview-setting input[type="checkbox"]');
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
    this.cameraPreviewSelector.addEventListener('change', (event) => {
      const checked = (event.target as HTMLInputElement).checked;
      handler(checked);
    });
  }

  /** Shows which hand is selected. */
  setHand(hand: Handedness): void {
    const input = this.handSelector.querySelector<HTMLInputElement>(`input[value="${hand}"]`);
    if (input) input.checked = true;
  }

  /** Shows whether the camera preview is selected. */
  setCameraPreview(visible: boolean): void {
    const input = this.cameraPreviewSelector.querySelector<HTMLInputElement>('input');
    if (input) input.checked = visible;
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`InstrumentPage: missing element ${selector}`);
  return element;
}