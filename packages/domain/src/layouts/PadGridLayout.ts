import type { Point } from "../geometry/Point";
import { DEGREES, type Degree } from "../music/Degree";
import type { Scale } from "../music/Scale";
import type { Layout } from "./Layout";
import type { Region } from "./Region";

/**
 * The play area has the camera's shape (4:3), so a region that is PAD_WIDTH wide must be
 * PAD_WIDTH × 4/3 high to be a square on the screen, and the web page draws it as a circle.
 */
const PAD_WIDTH = 0.2;
const PAD_HEIGHT = (PAD_WIDTH * 4) / 3;
/** Distance between the left sides of two neighbour pads in the same row (a bit more than PAD_WIDTH leaves a gap). */
const COLUMN_STEP = 0.23;
const LEFT = 0.04;
const TOP_ROW_Y = 0.2;
const BOTTOM_ROW_Y = TOP_ROW_Y + PAD_HEIGHT + 0.05;

/** Odd degrees (1, 3, 5, 7) go in the top row and even degrees (2, 4, 6, 8) in the bottom row, so the notes alternate. */
const REGIONS: readonly Region[] = DEGREES.map((degree) => {
  const column = Math.floor((degree - 1) / 2);
  const inBottomRow = degree % 2 === 0;
  return {
    degree,
    x: LEFT + column * COLUMN_STEP,
    y: inBottomRow ? BOTTOM_ROW_Y : TOP_ROW_Y,
    width: PAD_WIDTH,
    height: PAD_HEIGHT,
  };
});

/**
 * Two aligned rows of 4 pads, with alternating degrees:
 *
 *   1   3   5   7
 *   2   4   6   8
 *
 * The pads do not cover the whole play area, so the space between pads selects no degree.
 */
export class PadGridLayout implements Layout {
  regions(_scale: Scale): Region[] {
    return [...REGIONS];
  }

  hitTest(point: Point): Degree | null {
    // Points outside the play area are clamped to its edges.
    const x = Math.min(1, Math.max(0, point.x));
    const y = Math.min(1, Math.max(0, point.y));
    const region = REGIONS.find(
      (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height,
    );
    return region ? region.degree : null;
  }
}
