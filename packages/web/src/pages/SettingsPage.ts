import type { Handedness } from '@instrument/domain';

/** The settings screen. It only draws the choices and reports changes; it doesn't store anything. */
export class SettingsPage {
  private readonly handSelector: HTMLElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <main class="settings-page">
        <header>
          <h1>Settings</h1>
          <a class="nav-link" href="#/">← Back to instrument</a>
        </header>
        <fieldset class="settings hand-selector">
          <legend>Hand</legend>
          <label><input type="radio" name="hand" value="Left"> Left</label>
          <label><input type="radio" name="hand" value="Right" checked> Right</label>
        </fieldset>
      </main>`;
    this.handSelector = find(root, '.hand-selector');
  }

  /** Reports a hand choice made by the user. */
  onHandChange(handler: (hand: Handedness) => void): void {
    this.handSelector.addEventListener('change', (event) => {
      const value = (event.target as HTMLInputElement).value;
      if (value !== 'Left' && value !== 'Right') return;
      handler(value);
    });
  }

  /** Shows which hand is selected. Setting `checked` doesn't fire `change`, so this can't loop. */
  setHand(hand: Handedness): void {
    const input = this.handSelector.querySelector<HTMLInputElement>(`input[value="${hand}"]`);
    if (input) input.checked = true;
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`InstrumentPage: missing element ${selector}`);
  return element;
}