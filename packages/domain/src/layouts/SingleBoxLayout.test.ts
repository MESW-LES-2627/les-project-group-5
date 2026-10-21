import { describe, expect, it } from "vitest";
import { Scale } from "../music/Scale";
import { ScaleType } from "../music/ScaleType";
import { SingleBoxLayout } from "./SingleBoxLayout";

const layout = new SingleBoxLayout();

describe("SingleBoxLayout", () => {
  it("has one region, degree 1, in the middle of the play area", () => {
    expect(layout.regions(new Scale("C", ScaleType.MAJOR))).toEqual([
      { degree: 1, x: 0.3, y: 0.25, width: 0.4, height: 0.5 },
    ]);
  });

  it("selects degree 1 inside the box", () => {
    expect(layout.hitTest({ x: 0.5, y: 0.5 })).toBe(1);
    expect(layout.hitTest({ x: 0.3, y: 0.25 })).toBe(1); // top-left corner belongs to the box
  });

  it("selects nothing outside the box", () => {
    expect(layout.hitTest({ x: 0.1, y: 0.5 })).toBeNull();
    expect(layout.hitTest({ x: 0.5, y: 0.9 })).toBeNull();
    expect(layout.hitTest({ x: 0.7, y: 0.5 })).toBeNull(); // right edge belongs to the outside
  });
});
