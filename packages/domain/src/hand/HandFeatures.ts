import type { Point } from '../geometry/Point';

/** What the instrument reads from a hand in one frame, before calibration. */
export interface HandFeatures {
  /** The index fingertip, in the player's (mirrored) view: x 0 = left of the screen, y 0 = top. */
  readonly pointer: Point;
  /**
   * How open the hand is: the average distance from the wrist to the four fingertips,
   * divided by the distance from the wrist to the base of the middle finger.
   * Around 1 for a closed fist, around 2 for an open hand. Doesn't depend on the hand's size or distance.
   */
  readonly openness: number;
}
