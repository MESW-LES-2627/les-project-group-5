import type { Degree } from '../music/Degree';

/**
 * The rectangle where one degree is drawn, in normalized coordinates (see Point):
 * (x, y) is the top-left corner, and width and height go from 0 to 1.
 */
export interface Region {
  readonly degree: Degree;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
