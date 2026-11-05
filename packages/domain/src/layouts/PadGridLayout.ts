import type { Point } from "../geometry/Point";
import { DEGREES, type Degree } from "../music/Degree";
import type { Scale } from "../music/Scale";
import type { Layout } from "./Layout";
import type { Region } from "./Region";

const COLUMNS = 4;
const ROWS = 2;

/**
 * The 2×4 pad grid: 8 equal pads that fill the whole play area.
 * Low notes are at the bottom, so the player climbs the scale by moving the hand up:
 *
 *   5  6  7  8   (top row)
 *   1  2  3  4   (bottom row)
 *
 * Because the pads cover everything, there is always a pad under the pointer, so hitTest never returns null.
 */
export class PadGridLayout implements Layout {
  regions(_scale: Scale): Region[] {
    return DEGREES.map((degree) => {
      const index = degree - 1;
      const column = index % COLUMNS;
      // Row 0 is the top of the screen, but the first four degrees go in the bottom row.
      const row = ROWS - 1 - Math.floor(index / COLUMNS);
      return { degree, x: column / COLUMNS, y: row / ROWS, width: 1 / COLUMNS, height: 1 / ROWS };
    });
  }

  hitTest(point: Point): Degree {
    // Points outside the play area are clamped to its edges; the Math.min keeps x = 1 inside the last pad.
    const x = Math.min(1, Math.max(0, point.x));
    const y = Math.min(1, Math.max(0, point.y));
    const column = Math.min(COLUMNS - 1, Math.floor(x * COLUMNS));
    const row = Math.min(ROWS - 1, Math.floor(y * ROWS));
    const rowFromBottom = ROWS - 1 - row;
    return (rowFromBottom * COLUMNS + column + 1) as Degree;
  }
}
