import { describe, expect, it } from 'vitest';
import { toPlayerHandedness } from './handedness';

describe('toPlayerHandedness', () => {
  it('keeps MediaPipe labels as they are (checked with a real camera)', () => {
    expect(toPlayerHandedness('Right')).toBe('Right');
    expect(toPlayerHandedness('Left')).toBe('Left');
  });

  it('returns null for a missing or unknown label', () => {
    expect(toPlayerHandedness(undefined)).toBeNull();
    expect(toPlayerHandedness('')).toBeNull();
  });
});
