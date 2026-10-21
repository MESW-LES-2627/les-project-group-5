import { describe, expect, it } from 'vitest';
import { ScaleType } from './ScaleType';

// These tests make sure each scale type contains the semitone steps needed
// to map the instrument's eight degrees from the root up to the octave.
describe('ScaleType', () => {
  // Both supported scales must include one interval for each degree,
  // starting at the root and ending one octave above it.
  it('has 8 intervals for each type, from the root (0) to the octave (12)', () => {
    for (const type of [ScaleType.MAJOR, ScaleType.NATURAL_MINOR]) {
      expect(type.intervals).toHaveLength(8);
      expect(type.intervals[0]).toBe(0);
      expect(type.intervals[7]).toBe(12);
    }
  });

  // Check the exact semitone distance from the root for each degree.
  it('uses the major and natural minor intervals', () => {
    expect(ScaleType.MAJOR.intervals).toEqual([0, 2, 4, 5, 7, 9, 11, 12]);
    expect(ScaleType.NATURAL_MINOR.intervals).toEqual([0, 2, 3, 5, 7, 8, 10, 12]);
  });
});
