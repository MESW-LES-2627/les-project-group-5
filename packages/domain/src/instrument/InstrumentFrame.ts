import type { Point } from '../geometry/Point';
import type { Degree } from '../music/Degree';

/** What happens to the sound in this frame. */
export type NoteChange =
  /** A new note starts (stopping the previous one). */
  | {
      /** Says which kind of change this is. */
      readonly kind: 'start';
      /** The degree of the new note. */
      readonly degree: Degree;
    }
  /** The current note stops. */
  | {
      /** Says which kind of change this is. */
      readonly kind: 'stop';
    }
  /** Nothing changes (a note may keep sounding). */
  | {
      /** Says which kind of change this is. */
      readonly kind: 'none';
    };

/** The state of the instrument after one camera frame: everything the sound and the screen need. */
export interface InstrumentFrame {
  /** True when the player's hand was found in this frame. */
  readonly handDetected: boolean;
  /** Where the pointer is on the play area (0 to 1), or null without a hand. */
  readonly pointer: Point | null;
  /** The selected degree, or null without a hand or when the pointer is not on a cell. */
  readonly degree: Degree | null;
  /** Volume from 0 to 1 (0 without a hand). */
  readonly volume: number;
  /** True while a note is sounding. */
  readonly sounding: boolean;
  /** What the sound must do in this frame: start a note, stop it, or nothing. */
  readonly change: NoteChange;
}
