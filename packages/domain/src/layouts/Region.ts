import type { Degree } from '../music/Degree';

/**
 * The rectangle where one degree is drawn, in normalized coordinates (see Point):
 * (x, y) is the top-left corner, and width and height go from 0 to 1.
 */
export interface Region {
  /** The degree played when the pointer is inside this rectangle. */
  readonly degree: Degree;
  /** Left edge. */
  readonly x: number;
  /** Top edge. */
  readonly y: number;
  /** Width, as a part of the play area's width. */
  readonly width: number;
  /** Height, as a part of the play area's height. */
  readonly height: number;
}
