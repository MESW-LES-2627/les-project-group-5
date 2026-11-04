import type { Degree, Handedness, InstrumentFrame, Layout, Scale } from '@instrument/domain';
import { solfegeOf } from './solfege';

/**
 * The instrument screen: a header, the camera image with the cells (pads) and the pointer, a Start button,
 * a hint line, and a bottom bar with the scale, the volume and the dominant hand.
 * Also shows whether the server is reachable.
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
  private readonly debug: HTMLElement | null;
  private readonly scaleName: HTMLElement;
  private readonly handName: HTMLElement;
  private handLabel = 'right';
  private cells = new Map<Degree, HTMLElement>();
  private selected: HTMLElement | null = null;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app">
        <header class="app-header">
          <div class="brand">Web-based Gesture Instrument</div>
          <span class="server-status">Server: checking…</span>
          <nav aria-label="Main navigation">
            <button type="button" class="active" aria-current="page">Instrument</button>
            <!-- The Game and Settings pages come in later sprints, so these two do nothing yet. -->
            <button type="button" disabled title="Coming soon">Game</button>
            <button type="button" disabled title="Coming soon">Settings</button>
          </nav>
        </header>
        <main class="stage-area">
          <div class="stage">
            <video class="camera" autoplay muted playsinline></video>
            <div class="cells"></div>
            <div class="pointer" hidden><i></i></div>
            <p class="status" role="status"></p>
            <pre class="debug" hidden></pre>
            <div class="start-overlay">
              <button type="button" class="start">Start</button>
            </div>
          </div>
        </main>
        <footer class="status-bar">
          <div class="status-copy"><span class="live-dot"></span><strong class="scale-name"></strong><span>· 8 notes</span></div>
          <div class="volume">
            <label>Volume</label>
            <div class="volume-bar"><div class="volume-fill"></div></div>
            <output class="volume-value">0%</output>
          </div>
          <div class="hand-status"><span>Dominant hand</span><strong class="hand-name"></strong></div>
        </footer>
      </div>`;
    this.video = find(root, 'video.camera');
    this.cellsElement = find(root, '.cells');
    this.pointer = find(root, '.pointer');
    this.startButton = find(root, 'button.start');
    this.status = find(root, '.status');
    this.volumeFill = find(root, '.volume-fill');
    this.volumeValue = find(root, '.volume-value');
    this.serverStatus = find(root, '.server-status');
    // With ?debug at the end of the address, show the live numbers of the hand (to find why a note does not play).
    this.debug = new URLSearchParams(window.location.search).has('debug') ? find(root, '.debug') : null;
    this.debug?.removeAttribute('hidden');
    this.scaleName = find(root, '.scale-name');
    this.handName = find(root, '.hand-name');
  }

  onStart(handler: () => void): void {
    this.startButton.addEventListener('click', handler);
  }

  /** Draws one pad per region of the layout, with the note letter and its name (for example "C" and "Dó"). */
  showCells(layout: Layout, scale: Scale): void {
    this.cellsElement.replaceChildren();
    this.cells.clear();
    this.selected = null;
    for (const region of layout.regions(scale)) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      const note = scale.noteNameOf(region.degree);
      cell.innerHTML = `<strong>${note}</strong><span>${solfegeOf(note)}</span>`;
      cell.style.left = percent(region.x);
      cell.style.top = percent(region.y);
      cell.style.width = percent(region.width);
      cell.style.height = percent(region.height);
      this.cellsElement.append(cell);
      this.cells.set(region.degree, cell);
    }
  }

  /** Fills the bottom bar: the scale (for example "C MAJOR") and which hand plays. */
  showInfo(scale: Scale, hand: Handedness): void {
    this.scaleName.textContent = `${scale.root} ${scale.type.name}`;
    this.handLabel = hand.toLowerCase();
    this.handName.textContent = `${hand} hand`;
  }

  setServerStatus(online: boolean): void {
    this.serverStatus.textContent = online ? 'Server: online' : 'Server: offline';
    this.serverStatus.classList.toggle('online', online);
  }

  setStatus(message: string): void {
    this.status.textContent = message;
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

    // The bar follows the hand all the time (closed hand = empty, open hand = full), also between the pads.
    this.volumeFill.style.width = percent(frame.volume);
    this.volumeValue.textContent = `${Math.round(frame.volume * 100)}%`;

    if (this.debug) {
      const where = frame.pointer ? `${frame.pointer.x.toFixed(2)}, ${frame.pointer.y.toFixed(2)}` : '-';
      this.debug.textContent =
        `hand: ${frame.handDetected ? 'yes' : 'no'}  pointer: ${where}  pad: ${frame.degree ?? '-'}\n` +
        `volume: ${Math.round(frame.volume * 100)}%  sounding: ${frame.sounding ? 'yes' : 'no'}`;
    }

    this.setStatus(frame.handDetected ? HINT : `Show your ${this.handLabel} hand to the camera.`);
  }
}

/** The hint in the middle of the screen while playing; one line only. */
const HINT = 'Move your hand over a note to play';

function find<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`InstrumentPage: missing element ${selector}`);
  return element;
}

function percent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}
