import { DEGREES, type Degree } from "../music/Degree";
import type { Point } from "../geometry/Point";
import type { Scale } from "../music/Scale";
import type { Layout } from "./Layout";
import type { Region } from "./Region";

const COLUMNS = 2;
/** Centre of the first pad and the distance between the centres of two neighbour pads. */
const FIRST_CENTER_X = 0.34;
const FIRST_CENTER_Y = 0.32;
const COLUMN_STEP = 0.32;
const ROW_STEP = 0.18;
/** A pad is a bit smaller than the step, so there is a gap between pads that plays nothing. */
const PAD_WIDTH = 0.28;
const PAD_HEIGHT = 0.15;

const REGIONS: readonly Region[] = DEGREES.map((degree, index) => ({
  degree,
  x: FIRST_CENTER_X + (index % COLUMNS) * COLUMN_STEP - PAD_WIDTH / 2,
  y: FIRST_CENTER_Y + Math.floor(index / COLUMNS) * ROW_STEP - PAD_HEIGHT / 2,
  width: PAD_WIDTH,
  height: PAD_HEIGHT,
}));

/**
 * Eight equally sized pads in four rows of two, for narrow screens.
 * The web page draws each pad exactly on its region, so what the player sees is what the pointer hits.
 */
export class TwoColumnLayout implements Layout {
  regions(_scale: Scale): Region[] {
    return [...REGIONS];
  }

  hitTest(point: Point): Degree | null {
    // Points outside the play area are clamped to its edges. No pad touches an edge, so they select nothing.
    const x = Math.min(1, Math.max(0, point.x));
    const y = Math.min(1, Math.max(0, point.y));
    const region = REGIONS.find(
      (r) => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height,
    );
    return region?.degree ?? null;
  }
}
