import { Scale, type PitchClass } from '@instrument/domain';
import type { GameExercise } from '../exerciseData';

/** Adds exercise controls to the shared instrument stage without creating another camera surface. */
export class GamePage {
  private exercise: GameExercise | null = null;
  private exerciseScale: Scale | null = null;
  private readonly stageArea: HTMLElement;
  private readonly controls: HTMLElement;
  private readonly instrumentLink: HTMLAnchorElement;
  private readonly gameLink: HTMLAnchorElement;
  private visible = false;

  constructor(root: HTMLElement) {
    this.stageArea = find(root, '.stage-area');
    this.instrumentLink = find(root, 'nav a[href="#/"]');
    this.gameLink = find(root, 'nav a[href="#/game"]');

    this.controls = document.createElement('section');
    this.controls.className = 'game-controls';
    this.controls.hidden = true;
    this.controls.setAttribute('aria-label', 'Exercise controls');
    find(root, '.stage').append(this.controls);
    this.showLoading();
  }

  get scale(): Scale | null {
    return this.exerciseScale;
  }

  get hasExercise(): boolean {
    return this.exercise !== null;
  }

  get isVisible(): boolean {
    return this.visible;
  }

  setExercise(exercise: GameExercise | null): void {
    this.exercise = exercise;
    // The JSON parser has already checked the exercise; build its scale for the page and instrument layout.
    this.exerciseScale = exercise ? new Scale(exercise.key, exercise.scale) : null;
    this.renderControls();
    this.updateEmptyState();
  }

  showLoading(): void {
    this.exercise = null;
    this.exerciseScale = null;
    // Keep loading distinct from "no exercise": the data request may still return an exercise.
    this.renderMessage('Loading exercise', 'Please wait while exercise data is loaded.', 'status');
    this.updateEmptyState();
  }

  showLoadError(message: string): void {
    this.exercise = null;
    this.exerciseScale = null;
    this.renderMessage('Could not load exercises', message, 'alert');
    this.updateEmptyState();
  }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.stageArea.classList.toggle('game-mode', visible);
    this.updateEmptyState();
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

  private renderControls(): void {
    const exercise = this.exercise;
    const scale = this.exerciseScale;
    if (!exercise || !scale) {
      // An empty JSON list is valid, so show an empty state instead of treating it as a load failure.
      this.renderMessage('No exercise loaded', 'An exercise will appear here when one is available.', 'status');
      return;
    }

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
    find(this.controls, '.level-number').textContent = String(exercise.level).padStart(2, '0');
    find(this.controls, '.exercise-title').textContent = exercise.title;
    find(this.controls, '.exercise-scale').textContent = `${scale.root} ${scale.type.name}`;
    this.renderProgress(exercise.sequence);
  }

  private renderMessage(heading: string, message: string, role: 'status' | 'alert'): void {
    this.controls.innerHTML = `
      <div class="game-empty-message" role="${role}">
        <h1 class="game-message-heading"></h1>
        <p class="game-message-copy"></p>
      </div>`;
    find(this.controls, '.game-message-heading').textContent = heading;
    find(this.controls, '.game-message-copy').textContent = message;
  }

  private updateEmptyState(): void {
    this.stageArea.classList.toggle('game-empty', this.visible && !this.hasExercise);
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
