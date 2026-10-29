import type { Degree, Handedness, InstrumentFrame, Layout, Scale } from '@instrument/domain';

/**
 * The instrument screen: camera image, the cells, the pointer, a Start button, a status line, a volume bar
 * and whether the server is reachable.
 * It only draws what it is told. It has no rules about notes or sound.
 */
export class InstrumentPage {
  readonly video: HTMLVideoElement;
  private readonly cellsElement: HTMLElement;
  private readonly pointer: HTMLElement;
  private readonly startButton: HTMLButtonElement;
  private readonly status: HTMLElement;
  private readonly volumeFill: HTMLElement;
  private readonly volumeValue: HTMLElement;
  private readonly serverStatus: HTMLElement;
  private cells = new Map<Degree, HTMLElement>();
  private selected: HTMLElement | null = null;
  private hand: Handedness = 'Right';
  private started = false;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <main class="instrument">
        <header>
          <h1>Gesture Web Instrument</h1>
          <a class="nav-link" href="#/settings">⚙ Settings</a>
          <span class="server-status">Server: checking…</span>
        </header>
        <div class="stage">
          <video class="camera" autoplay muted playsinline></video>
          <div class="cells"></div>
          <div class="pointer" hidden></div>
          <div class="start-overlay">
            <button type="button" class="start">Start</button>
          </div>
        </div>
        <p class="status" role="status"></p>
        <div class="volume">
          <span>Volume</span>
          <div class="volume-bar"><div class="volume-fill"></div></div>
          <span class="volume-value">0%</span>
        </div>
      </main>`;
    this.video = find(root, 'video.camera');
    this.cellsElement = find(root, '.cells');
    this.pointer = find(root, '.pointer');
    this.startButton = find(root, 'button.start');
    this.status = find(root, '.status');
    this.volumeFill = find(root, '.volume-fill');
    this.volumeValue = find(root, '.volume-value');
    this.serverStatus = find(root, '.server-status');
  }

  onStart(handler: () => void): void {
    this.startButton.addEventListener('click', () => {
      this.started = true;
      handler();
    });
  }

  /** Draws one cell per region of the layout, labelled for the scale (for example "1 C"). */
  showCells(layout: Layout, scale: Scale): void {
    this.cellsElement.replaceChildren();
    this.cells.clear();
    this.selected = null;
    for (const region of layout.regions(scale)) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.textContent = scale.labelOf(region.degree);
      cell.style.left = percent(region.x);
      cell.style.top = percent(region.y);
      cell.style.width = percent(region.width);
      cell.style.height = percent(region.height);
      this.cellsElement.append(cell);
      this.cells.set(region.degree, cell);
    }
  }

  setServerStatus(online: boolean): void {
    this.serverStatus.textContent = online ? 'Server: online' : 'Server: offline';
    this.serverStatus.classList.toggle('online', online);
  }

  setStatus(message: string): void {
    this.status.textContent = message;
  }

  /** Shows which hand is selected, for the initial value or to correct the UI after a rejected change. */
  setHand(hand: Handedness): void {
    this.hand = hand;
    if (!this.started) {
      this.setStatus(`Press Start, allow the camera, and play with your ${hand.toLowerCase()} hand.`);
    }
  }

  /** Shows the Start button again (for example after an error), with a new label. */
  showStart(label: string): void {
    this.startButton.textContent = label;
    this.startButton.disabled = false;
    this.startButton.parentElement!.hidden = false;
  }

  hideStart(): void {
    this.startButton.parentElement!.hidden = true;
  }

  setStartEnabled(enabled: boolean): void {
    this.startButton.disabled = !enabled;
  }

  /** Called on every frame: moves the pointer, highlights the selected cell and updates the volume bar. */
  render(frame: InstrumentFrame): void {
    if (frame.pointer) {
      this.pointer.hidden = false;
      this.pointer.style.left = percent(frame.pointer.x);
      this.pointer.style.top = percent(frame.pointer.y);
    } else {
      this.pointer.hidden = true;
    }

    const cell = frame.degree === null ? null : (this.cells.get(frame.degree) ?? null);
    if (cell !== this.selected) {
      this.selected?.classList.remove('selected', 'sounding');
      cell?.classList.add('selected');
      this.selected = cell;
    }
    cell?.classList.toggle('sounding', frame.sounding);

    const volume = frame.sounding ? frame.volume : 0;
    this.volumeFill.style.width = percent(volume);
    this.volumeValue.textContent = `${Math.round(volume * 100)}%`;

    this.setStatus(frame.handDetected ? '' : `Show your ${this.hand.toLowerCase()} hand to the camera.`);
  }
}

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`InstrumentPage: missing element ${selector}`);
  return element;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
