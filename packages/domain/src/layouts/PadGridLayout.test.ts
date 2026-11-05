import { describe, expect, it } from "vitest";
import { Scale } from "../music/Scale";
import { ScaleType } from "../music/ScaleType";
import { PadGridLayout } from "./PadGridLayout";

const layout = new PadGridLayout();

describe("PadGridLayout", () => {
  it("has 8 regions, one per degree", () => {
    const regions = layout.regions(new Scale("C", ScaleType.MAJOR));
    expect(regions.map((r) => r.degree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("puts low notes in the bottom row and high notes in the top row", () => {
    const regions = layout.regions(new Scale("C", ScaleType.MAJOR));
    expect(regions[0]).toEqual({ degree: 1, x: 0, y: 0.5, width: 0.25, height: 0.5 });
    expect(regions[7]).toEqual({ degree: 8, x: 0.75, y: 0, width: 0.25, height: 0.5 });
  });

  it("selects the degree of the pad under the point", () => {
    expect(layout.hitTest({ x: 0.1, y: 0.75 })).toBe(1);
    expect(layout.hitTest({ x: 0.9, y: 0.75 })).toBe(4);
    expect(layout.hitTest({ x: 0.1, y: 0.25 })).toBe(5);
    expect(layout.hitTest({ x: 0.9, y: 0.25 })).toBe(8);
  });

  it("clamps points outside the play area to the nearest edge pad", () => {
    expect(layout.hitTest({ x: -0.2, y: 1.3 })).toBe(1);
    expect(layout.hitTest({ x: 1, y: 0 })).toBe(8);
  });
});
