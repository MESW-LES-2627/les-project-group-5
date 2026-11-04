import { describe, expect, it } from "vitest";
import { Scale } from "../music/Scale";
import { ScaleType } from "../music/ScaleType";
import { TwoColumnLayout } from "./TwoColumnLayout";

const layout = new TwoColumnLayout();
const regions = layout.regions(new Scale("C", ScaleType.MAJOR));

describe("TwoColumnLayout", () => {
  it("places all eight degrees in four rows of two columns", () => {
    expect(regions.map((region) => region.degree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(regions.map((region) => region.y)).size).toBe(4);
    expect(new Set(regions.map((region) => region.x)).size).toBe(2);
  });

  it("selects the degree under each pad's centre", () => {
    for (const region of regions) {
      expect(
        layout.hitTest({
          x: region.x + region.width / 2,
          y: region.y + region.height / 2,
        }),
      ).toBe(region.degree);
    }
  });

  it("spreads the columns apart and keeps some space around the grid", () => {
    expect(regions[0].x + regions[0].width / 2).toBeCloseTo(0.34);
    expect(regions[1].x + regions[1].width / 2).toBeCloseTo(0.66);
    expect(regions[0].y + regions[0].height / 2).toBeCloseTo(0.32);
    expect(regions[6].y + regions[6].height / 2).toBeCloseTo(0.86);
    expect(layout.hitTest({ x: 0.5, y: -0.1 })).toBeNull();
    expect(layout.hitTest({ x: 1.1, y: 0.87 })).toBeNull();
  });
});
