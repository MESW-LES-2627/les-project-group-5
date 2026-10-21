import { describe, expect, it } from 'vitest';
import { pickHand } from './pickHand';
import { makeHand } from './testHands';

describe('pickHand', () => {
  const left = makeHand({ handedness: 'Left' });
  const right = makeHand({ handedness: 'Right' });

  it('picks the dominant hand when both hands are in view', () => {
    expect(pickHand([left, right], 'Right')).toBe(right);
    expect(pickHand([left, right], 'Left')).toBe(left);
  });

  it('ignores the other hand when it is the only one in view', () => {
    expect(pickHand([left], 'Right')).toBeNull();
  });

  it('returns null when no hand is in view', () => {
    expect(pickHand([], 'Right')).toBeNull();
  });
});
