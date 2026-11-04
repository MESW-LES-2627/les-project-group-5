import { DEGREES, type Degree } from "../music/Degree";
import type { Point } from "../geometry/Point";
import type { Scale } from "../music/Scale";
import type { Layout } from "./Layout";
import type { Region } from "./Region";

const COLUMNS = 2;
const REGIONS: readonly Region[] = DEGREES.map((degree, index) => ({
  degree,
  x: 0.18 + (index % COLUMNS) * 0.32,
  y: 0.23 + Math.floor(index / COLUMNS) * 0.18,
  width: 0.32,
  height: 0.18,
}));

/** Eight equally sized pads in four rows of two, for narrow screens. */
export class TwoColumnLayout implements Layout {
  regions(_scale: Scale): Region[] {
    return [...REGIONS];
  }

  hitTest(point: Point): Degree | null {
    const x = Math.min(1, Math.max(0, point.x));
    const y = Math.min(1, Math.max(0, point.y));
    const region = REGIONS.find((candidate) =>
      x >= candidate.x &&
      (x < candidate.x + candidate.width || candidate.x + candidate.width === 1) &&
      y >= candidate.y &&
      (y < candidate.y + candidate.height || candidate.y + candidate.height === 1),
    );
    return region?.degree ?? null;
  }
}
