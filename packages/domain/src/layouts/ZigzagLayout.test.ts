import { describe, expect, it } from "vitest";
import { Scale } from "../music/Scale";
import { ScaleType } from "../music/ScaleType";
import { ZigzagLayout } from "./ZigzagLayout";

const layout = new ZigzagLayout();
const regions = layout.regions(new Scale("C", ScaleType.MAJOR));

describe("ZigzagLayout", () => {
  it("has 8 regions, one per degree", () => {
    expect(regions.map((r) => r.degree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it("alternates the notes: odd degrees on the top row, even degrees on the bottom row", () => {
    const topRow = regions.filter((r) => r.degree % 2 === 1);
    const bottomRow = regions.filter((r) => r.degree % 2 === 0);
    expect(new Set(topRow.map((r) => r.y)).size).toBe(1);
    expect(new Set(bottomRow.map((r) => r.y)).size).toBe(1);
    expect(bottomRow[0].y).toBeGreaterThan(topRow[0].y);
  });

  it("moves the bottom row to the right of the top row, like a zigzag", () => {
    expect(regions[1].x).toBeGreaterThan(regions[0].x); // 2 is right of 1
    expect(regions[1].x).toBeLessThan(regions[2].x); // but still left of 3
  });

  it("keeps every pad inside the play area", () => {
    for (const r of regions) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
      expect(r.x + r.width).toBeLessThanOrEqual(1);
      expect(r.y + r.height).toBeLessThanOrEqual(1);
    }
  });

  it("selects the degree of the pad under the point (its centre)", () => {
    for (const r of regions) {
      expect(layout.hitTest({ x: r.x + r.width / 2, y: r.y + r.height / 2 })).toBe(r.degree);
    }
  });

  it("selects nothing between pads or outside them", () => {
    expect(layout.hitTest({ x: 0.5, y: 0.02 })).toBeNull(); // above the pads
    expect(layout.hitTest({ x: 0, y: 0 })).toBeNull(); // corner of the play area (clamped)
    expect(layout.hitTest({ x: -1, y: 2 })).toBeNull(); // far outside (clamped)
  });
});
