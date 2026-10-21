import { describe, expect, it } from 'vitest';
import { HandFeatureExtractor } from './HandFeatureExtractor';
import { makeHand } from './testHands';

const extractor = new HandFeatureExtractor();

describe('HandFeatureExtractor', () => {
  describe('pointer', () => {
    it('is the index fingertip, mirrored horizontally', () => {
      const features = extractor.extract(makeHand({ indexTip: { x: 0.2, y: 0.3 } }));
      expect(features.pointer.x).toBeCloseTo(0.8);
      expect(features.pointer.y).toBeCloseTo(0.3);
    });

    it('keeps the centre in the centre', () => {
      const features = extractor.extract(makeHand({ indexTip: { x: 0.5, y: 0.5 } }));
      expect(features.pointer).toEqual({ x: 0.5, y: 0.5 });
    });
  });

  describe('openness', () => {
    it('is the average fingertip reach divided by the palm size', () => {
      expect(extractor.extract(makeHand({ reach: 2 })).openness).toBeCloseTo(2);
      expect(extractor.extract(makeHand({ reach: 1 })).openness).toBeCloseTo(1);
    });

    it('is higher for an open hand than for a fist', () => {
      const open = extractor.extract(makeHand({ reach: 1.9 })).openness;
      const fist = extractor.extract(makeHand({ reach: 0.9 })).openness;
      expect(open).toBeGreaterThan(fist);
    });

    it('does not depend on the size of the hand', () => {
      const small = extractor.extract(makeHand({ reach: 1.5, palmSize: 0.07 })).openness;
      const large = extractor.extract(makeHand({ reach: 1.5, palmSize: 0.11 })).openness;
      expect(small).toBeCloseTo(large);
    });

    it('is 0 when the palm has no size (bad tracking data)', () => {
      expect(extractor.extract(makeHand({ palmSize: 0 })).openness).toBe(0);
    });
  });

  it('rejects a hand without exactly 21 landmarks', () => {
    const hand = makeHand({});
    expect(() => extractor.extract({ ...hand, landmarks: hand.landmarks.slice(0, 20) })).toThrow(RangeError);
    expect(() => extractor.extract({ ...hand, worldLandmarks: [] })).toThrow(RangeError);
  });
});
