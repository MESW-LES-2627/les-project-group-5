import type { Point } from "../geometry/Point";
import type { Degree } from "../music/Degree";
import type { Scale } from "../music/Scale";
import type { Region } from "./Region";

/**
 * How the 8 degrees of a scale are placed on the play area.
 * Each layout (pad grid, piano, …) is one class that implements this interface,
 * so a new layout can be added without changing tracking or audio code.
 */
export interface Layout {
  /** The regions to draw for the given scale, in normalized coordinates. */
  regions(scale: Scale): Region[];

  /**
   * The degree at a point, or null if no cell is there (for example outside the single box).
   * Points outside the play area (below 0 or above 1) are clamped to its edges.
   */
  hitTest(point: Point): Degree | null;
}
