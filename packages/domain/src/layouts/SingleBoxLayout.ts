import type { Point } from "../geometry/Point";
import type { Degree } from "../music/Degree";
import type { Scale } from "../music/Scale";
import type { Layout } from "./Layout";
import type { Region } from "./Region";

/** The box sits in the middle of the play area, so the hand has to move to reach it. */
const BOX: Region = { degree: 1, x: 0.3, y: 0.25, width: 0.4, height: 0.5 };

/**
 * The simplest layout: one box in the middle of the play area that plays degree 1.
 * Used by the vertical prototype to show the whole stack working: the hand selects the box and it sounds.
 * The 2×4 pad grid (PadGridLayout) replaces it in Sprint 1, with a one-line change in main.ts.
 */
export class SingleBoxLayout implements Layout {
  regions(_scale: Scale): Region[] {
    return [BOX];
  }

  hitTest(point: Point): Degree | null {
    const inside =
      point.x >= BOX.x &&
      point.x < BOX.x + BOX.width &&
      point.y >= BOX.y &&
      point.y < BOX.y + BOX.height;
    return inside ? BOX.degree : null;
  }
}
