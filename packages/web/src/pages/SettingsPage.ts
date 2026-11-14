import { PITCH_CLASSES, ScaleType, type Handedness, type PitchClass, type LayoutKind } from '@instrument/domain';
import { appHeader } from './appHeader';

const SCALE_OPTIONS: readonly { type: ScaleType; label: string }[] = [
  { type: ScaleType.MAJOR, label: 'Major' },
  { type: ScaleType.NATURAL_MINOR, label: 'Natural minor' },
];

export const LAYOUT_OPTIONS: readonly { kind: LayoutKind; label: string }[] = [
  { kind: 'pad-grid', label: 'Pad grid' },
  { kind: 'single-box', label: 'Single box' },
];


/** The settings screen. It only draws the choices and reports changes; it doesn't store anything. */
export class SettingsPage {
  private readonly handSelector: HTMLElement;
  private readonly pitchSelector: HTMLSelectElement;
  private readonly scaleSelector: HTMLSelectElement;
  private readonly layoutSelector: HTMLSelectElement;
  private readonly cameraPreviewInput: HTMLInputElement;
  private readonly serverStatus: HTMLElement;
  

  constructor(root: HTMLElement) {
    // The option values for the scale are indexes into SCALE_OPTIONS, so this works
    // whatever the underlying values of ScaleType are.
    const pitchOptions = PITCH_CLASSES.map((p) => `<option value="${p}">${p}</option>`).join('');
    const scaleOptions = SCALE_OPTIONS.map((o, i) => `<option value="${i}">${o.label}</option>`).join('');
    const layoutOptions = LAYOUT_OPTIONS.map((o) => `<option value="${o.kind}">${o.label}</option>`).join('');
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
                <label><input type="radio" name="hand" value="Left"><span>Left hand</span></label>
                <label><input type="radio" name="hand" value="Right" checked><span>Right hand</span></label>
              </fieldset>
            </section>
            <section>
              <div class="section-title">
                <h2>Pitch and scale</h2>
                <p>Choose the root note and the type of scale.</p>
              </div>
              <div class="scale-controls">
                <label>Pitch <select class="root-select">${pitchOptions}</select></label>
                <label>Scale <select class="scale-type-select">${scaleOptions}</select></label>
              </div>
            </section>
            <section>
              <div class="section-title">
                <h2>Layout</h2>
                <p>Choose how the notes are arranged on the instrument page.</p>
              </div>
              <div class="scale-controls">
                <label>Layout <select class="layout-select">${layoutOptions}</select></label>
              </div>
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
    this.pitchSelector = find(root, '.root-select');
    this.scaleSelector = find(root, '.scale-type-select');
    this.cameraPreviewInput = find(root, '.toggle input[type="checkbox"]');
    this.layoutSelector = find(root, '.layout-select');
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

  /** Reports a pitch choice made by the user. */
  onPitchChange(handler: (pitch: PitchClass) => void): void {
    this.pitchSelector.addEventListener('change', () => {
      const value = this.pitchSelector.value as PitchClass;
      if (!PITCH_CLASSES.includes(value)) return;
      handler(value);
    });
  }

  /** Reports a scale choice made by the user. */
  onScaleChange(handler: (scale: ScaleType) => void): void {
    this.scaleSelector.addEventListener('change', () => {
      const index = parseInt(this.scaleSelector.value, 10);
      if (isNaN(index) || index < 0 || index >= SCALE_OPTIONS.length) return;
      handler(SCALE_OPTIONS[index].type);
    });
  }

  /** Reports a layout choice made by the user. */
  onLayoutChange(handler: (layout: LayoutKind) => void): void {
    this.layoutSelector.addEventListener('change', () => {
      const option = LAYOUT_OPTIONS.find((o) => o.kind === this.layoutSelector.value);
      if (option) handler(option.kind);
    });
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

  /** Shows which pitch is selected. */
  setPitch(pitch: PitchClass): void {
    this.pitchSelector.value = pitch;
  }

  /** Shows which scale is selected. */
  setScale(scale: ScaleType): void {
    const index = SCALE_OPTIONS.findIndex((o) => o.type === scale);
    if (index >= 0) this.scaleSelector.value = index.toString();
  }

  /** Shows which layout is selected. */
  setLayout(layout: LayoutKind): void {
    this.layoutSelector.value = layout;
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`SettingsPage: missing element ${selector}`);
  return element;
}
