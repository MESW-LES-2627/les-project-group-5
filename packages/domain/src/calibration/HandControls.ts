import type { Point } from '../geometry/Point';

/** The hand after calibration: what the instrument actually plays with. */
export interface HandControls {
  /** Where the pointer is on the play area, from 0 to 1 on both axes (y 0 = top). */
  readonly pointer: Point;
  /** Volume from 0 (closed fist) to 1 (fully open hand). */
  readonly volume: number;
}
