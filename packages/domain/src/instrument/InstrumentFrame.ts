import type { Point } from '../geometry/Point';
import type { Degree } from '../music/Degree';

/** What happens to the sound in this frame. */
export type NoteChange =
  | { readonly kind: 'start'; readonly degree: Degree } // a new note starts (stopping the previous one)
  | { readonly kind: 'stop' } // the current note stops
  | { readonly kind: 'none' }; // nothing changes (a note may keep sounding)

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
  readonly change: NoteChange;
}
