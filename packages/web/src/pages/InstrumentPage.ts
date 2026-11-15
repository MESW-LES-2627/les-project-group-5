import type { Degree, Handedness, InstrumentFrame, Layout, Scale } from '@instrument/domain';
import type { HealthStatus } from '../api/ApiClient';
import { appHeader } from './appHeader';
import { solfegeOf } from './solfege';

/**
 * The instrument screen: camera image, the cells, the pointer, a Start button, a status line, a volume bar
 * and whether the server and its database are reachable.
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
  private readonly databaseStatus: HTMLElement;
  private readonly debug: HTMLElement | null;
  private readonly scaleName: HTMLElement;
  private readonly handName: HTMLElement;
  private cells = new Map<Degree, HTMLElement>();
  private selected: HTMLElement | null = null;
  private handLabel = 'right';
  private started = false;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="app-shell">
        ${appHeader('instrument')}
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
          <div class="status-copy">
            <span class="live-dot"></span>
            <strong class="scale-name"></strong>
            <span>· 8 notes</span>
          </div>
          <div class="volume">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path d="M11 5 6 9H3v6h3l5 4Z" /><path d="M15 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12" /></svg>
            <span>Volume</span>
            <div class="volume-bar"><div class="volume-fill"></div></div>
            <output class="volume-value">0%</output>
          </div>
          <div class="status-right">
            <div class="hand-status"><span>Dominant hand</span><strong class="hand-name"> </strong></div>
            <div class="connection">
              <span class="status-light server-status">Server: checking…</span>
              <span class="status-light database-status">Database: checking…</span>
            </div>
          </div>
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
    this.databaseStatus = find(root, '.database-status');
    // With ?debug at the end of the address, show the live numbers of the hand (to find why a note does not play).
    this.debug = new URLSearchParams(window.location.search).has('debug') ? find(root, '.debug') : null;
    this.debug?.removeAttribute('hidden');
    this.scaleName = find(root, '.scale-name');
    this.handName = find(root, '.hand-name');
  }

  onStart(handler: () => void): void {
    this.startButton.addEventListener('click', () => {
      this.started = true;
      handler();
    });
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
    this.handName.textContent = `${this.handLabel} hand`;
  }

  /** Shows whether the server and its database can be reached. */
  setHealthStatus(health: HealthStatus): void {
    showLight(this.serverStatus, 'Server', health.server);
    showLight(this.databaseStatus, 'Database', health.database);
  }

  setStatus(message: string): void {
    this.status.textContent = message;
  }

  /** Shows which hand is selected, for the initial value or to correct the UI after a rejected change. */
  setHand(hand: Handedness): void {
    this.handLabel = hand.toLowerCase();
    this.handName.textContent = `${this.handLabel} hand`;
    if (!this.started) {
      this.setStatus(`Press Start, allow the camera, and play with your ${this.handLabel} hand.`);
    }
  }

  /** Shows or hides the camera image. */
  setCameraPreviewVisible(visible: boolean): void {
    this.video.classList.toggle('camera-hidden', !visible);
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

/** Writes "Name: online/offline" and turns the dot green when online. */
function showLight(element: HTMLElement, name: string, online: boolean): void {
  element.textContent = `${name}: ${online ? 'online' : 'offline'}`;
  element.classList.toggle('online', online);
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
