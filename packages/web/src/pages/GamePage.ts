import { PITCH_CLASSES, Scale, ScaleType, type PitchClass } from '@instrument/domain';

/** Details the Game page needs to show one exercise; this does not load or choose exercises. */
export interface GameExercise {
  /** Unique exercise identifier, for example when loading it from a data file. */
  readonly id: number;
  /** Difficulty level shown to the player. */
  readonly level: number;
  /** Player-friendly name shown above the instructions. */
  readonly title: string;
  /** The scale's starting note, such as C. */
  readonly key: PitchClass;
  /** The note pattern used from that starting note, such as major or minor. */
  readonly scale: string;
  /** The exact notes the player is asked to reproduce, in order. */
  readonly sequence: readonly PitchClass[];
}

/** Adds exercise controls to the shared instrument stage without creating another camera surface. */
export class GamePage {
  readonly scale: Scale | null;
  private readonly stageArea: HTMLElement;
  private readonly controls: HTMLElement;
  private readonly instrumentLink: HTMLAnchorElement;
  private readonly gameLink: HTMLAnchorElement;
  private visible = false;

  constructor(root: HTMLElement, exercise: GameExercise | null) {
    let exerciseScale: Scale | null = null;
    if (exercise) {
      const scaleType = ScaleType.fromId(exercise.scale);
      if (!scaleType) throw new Error(`GamePage: unknown exercise scale "${exercise.scale}"`);
      if (!PITCH_CLASSES.includes(exercise.key)) {
        throw new Error(`GamePage: unknown exercise key "${exercise.key}"`);
      }
      if (exercise.sequence.length === 0 || !exercise.sequence.every((note) => PITCH_CLASSES.includes(note))) {
        throw new Error('GamePage: exercise sequence must contain valid notes');
      }
      // The exercise decides which notes appear in Game; the player's Instrument scale setting does not.
      exerciseScale = new Scale(exercise.key, scaleType);
    }
    this.scale = exerciseScale;
    this.stageArea = find(root, '.stage-area');
    this.instrumentLink = find(root, 'nav a[href="#/"]');
    this.gameLink = find(root, 'nav a[href="#/game"]');

    this.controls = document.createElement('section');
    this.controls.className = 'game-controls';
    this.controls.hidden = true;
    this.controls.setAttribute('aria-label', 'Exercise controls');
    if (exercise) {
      this.controls.innerHTML = `
        <div class="game-heading">
          <div class="game-level">
            <span>Level</span>
            <strong class="level-number"></strong>
          </div>
          <div class="game-title">
            <p class="exercise-title"></p>
            <h1>Listen, remember, repeat</h1>
            <p class="exercise-scale"></p>
          </div>
          <ol class="game-progress" aria-label="Notes to reproduce"></ol>
        </div>
        <div class="game-action">
          <p class="game-instructions">
            Listen to the notes, then play them back in the same order.
          </p>
          <button type="button" class="game-play">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20">
              <path d="m9 7 8 5-8 5Z" />
            </svg>
            Play melody
          </button>
        </div>`;
    } else {
      // Until an exercise is provided, avoid inventing a level, note sequence, or playable action.
      this.controls.innerHTML = `
        <div class="game-empty-message" role="status">
          <h1>No exercise loaded</h1>
          <p>An exercise will appear here when one is available.</p>
        </div>`;
    }
    find(root, '.stage').append(this.controls);

    if (exercise && exerciseScale) {
      find(this.controls, '.level-number').textContent = String(exercise.level).padStart(2, '0');
      find(this.controls, '.exercise-title').textContent = exercise.title;
      find(this.controls, '.exercise-scale').textContent = `${exerciseScale.root} ${exerciseScale.type.name}`;
      this.renderProgress(exercise.sequence);
    }
  }

  get hasExercise(): boolean {
    return this.scale !== null;
  }

  get isVisible(): boolean {
    return this.visible;
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.stageArea.classList.toggle('game-mode', visible);
    this.stageArea.classList.toggle('game-empty', visible && !this.hasExercise);
    this.controls.hidden = !visible;
    this.instrumentLink.classList.toggle('active', !visible);
    this.gameLink.classList.toggle('active', visible);
    if (visible) {
      this.instrumentLink.removeAttribute('aria-current');
      this.gameLink.setAttribute('aria-current', 'page');
    } else {
      this.instrumentLink.setAttribute('aria-current', 'page');
      this.gameLink.removeAttribute('aria-current');
    }
  }

  private renderProgress(sequence: readonly PitchClass[]): void {
    const progress = find(this.controls, '.game-progress');
    progress.setAttribute('aria-label', `${sequence.length} notes to reproduce`);

    // Each bar represents one note in the order to copy; hidden text gives screen readers the note names.
    sequence.forEach((note, index) => {
      const step = document.createElement('li');
      const description = document.createElement('span');
      description.className = 'visually-hidden';
      description.textContent = `Note ${index + 1}: ${note}`;
      step.append(description);
      progress.append(step);
    });
  }
}

function find<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`GamePage: missing element ${selector}`);
  return element;
}
