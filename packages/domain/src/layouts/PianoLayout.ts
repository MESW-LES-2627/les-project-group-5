import { isDegree, type Degree } from '../music/Degree';
import { PITCH_CLASSES, type PitchClass } from '../music/PitchClass';
import type { Point } from '../geometry/Point';
import type { Scale } from '../music/Scale';
import type { Layout } from './Layout';
import type { Region } from './Region';

// Black-key width is measured against one white key; height and placement use play-area coordinates.
const BLACK_KEY_WIDTH = 0.62;
const BLACK_KEY_HEIGHT = 0.34;
const KEYBOARD_TOP = 0.22;
const WHITE_KEY_HEIGHT = 0.56;

/**
 * One visible key in the selected root's octave. A null degree means the key is drawn
 * for the full chromatic keyboard, but is outside the scale and cannot be played.
 */
export interface PianoKey {
  /** The key's real pitch name, independent of the selected root. */
  readonly note: PitchClass;
  /** Its playable scale degree, or null when the note falls outside the selected scale. */
  readonly degree: Degree | null;
  /** Sharps are the black keys; natural notes are the white keys. */
  readonly color: 'white' | 'black';
  /** Normalized position and size within the camera play area. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * A 13-key chromatic octave from the selected root to the next root. It implements
 * Layout so the instrument can play its eight scale degrees without special tracking logic.
 */
export class PianoLayout implements Layout {
  // hitTest has no scale argument, so regions() keeps the rendered keys for matching pointer input.
  private hitTestKeys: PianoKey[] = [];

  /** Returns all semitone keys, marking selected-scale notes with their playable degree. */
  keys(scale: Scale): PianoKey[] {
    const rootIndex = PITCH_CLASSES.indexOf(scale.root);
    // Include offsets 0 through 12 so the root appears at both ends of the octave.
    const notes = Array.from({ length: 13 }, (_, offset) => {
      const pitchIndex = (rootIndex + offset) % PITCH_CLASSES.length;
      const interval = offset;
      const degreeIndex = scale.type.intervals.indexOf(interval);
      const degreeValue = degreeIndex + 1;
      const degree = isDegree(degreeValue) ? degreeValue : null;

      return {
        note: PITCH_CLASSES[pitchIndex],
        degree,
        color: isBlackKey(PITCH_CLASSES[pitchIndex]) ? 'black' as const : 'white' as const,
      };
    });
    const whiteKeyCount = notes.filter((key) => key.color === 'white').length;
    const whiteKeyWidth = 1 / whiteKeyCount;
    let whiteKeysBefore = 0;

    // White keys form the base row; black keys are positioned over the boundaries between them.
    return notes.map((key) => {
      if (key.color === 'white') {
        const x = whiteKeysBefore * whiteKeyWidth;
        whiteKeysBefore += 1;
        return {
          ...key,
          x,
          y: KEYBOARD_TOP,
          width: whiteKeyWidth,
          height: WHITE_KEY_HEIGHT,
        };
      }

      // The first or last note can itself be black; show its visible half without leaving the play area.
      const isAtKeyboardEdge = whiteKeysBefore === 0 || whiteKeysBefore === whiteKeyCount;
      const width = whiteKeyWidth * BLACK_KEY_WIDTH * (isAtKeyboardEdge ? 0.5 : 1);
      const boundary = whiteKeysBefore / whiteKeyCount;
      const x =
        whiteKeysBefore === 0
          ? 0
          : Math.min(1 - width, Math.max(0, boundary - width / 2));
      return {
        ...key,
        x,
        y: KEYBOARD_TOP,
        width,
        height: BLACK_KEY_HEIGHT,
      };
    });
  }

  /**
   * Only scale notes have regions: the other chromatic keys are visible to the player
   * but must not be selectable by the hand tracker.
   */
  regions(scale: Scale): Region[] {
    const keys = this.keys(scale);
    this.hitTestKeys = keys;
    return keys
      .filter((key): key is PianoKey & { degree: Degree } => key.degree !== null)
      .map(({ degree, x, y, width, height }) => ({ degree, x, y, width, height }));
  }

  /** Gives black keys priority where they overlap white keys, just like a physical keyboard. */
  hitTest(point: Point): Degree | null {
    const x = Math.min(1, Math.max(0, point.x));
    const y = Math.min(1, Math.max(0, point.y));
    const key =
      this.hitTestKeys.find(
        (candidate) =>
          candidate.color === 'black' &&
          x >= candidate.x &&
          x < candidate.x + candidate.width &&
          y >= candidate.y &&
          y < candidate.y + candidate.height,
      ) ??
      this.hitTestKeys.find(
        (candidate) =>
          candidate.color === 'white' &&
          x >= candidate.x &&
          x < candidate.x + candidate.width &&
          y >= candidate.y &&
          y < candidate.y + candidate.height,
      );
    return key?.degree ?? null;
  }
}

/** This project uses sharps for the five black-key pitch classes. */
function isBlackKey(note: PitchClass): boolean {
  return note.includes('#');
}
