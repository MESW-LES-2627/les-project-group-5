import { describe, expect, it } from 'vitest';
import { HandFeatureExtractor } from '../hand/HandFeatureExtractor';
import { makeHand } from '../hand/testHands';
import { calibrationForSensitivity, DEFAULT_CALIBRATION_PROFILE } from './CalibrationProfile';

describe('DEFAULT_CALIBRATION_PROFILE', () => {
  const profile = DEFAULT_CALIBRATION_PROFILE;

  it('maps the centre of the camera image to the centre of the play area', () => {
    const controls = profile.apply({ pointer: { x: 0.5, y: 0.5 }, openness: 1.4 });
    expect(controls.pointer.x).toBeCloseTo(0.5);
    expect(controls.pointer.y).toBeCloseTo(0.5);
  });

  it('reaches the edges of the play area before the hand reaches the edges of the image', () => {
    const topLeft = profile.apply({ pointer: { x: 0.2, y: 0.2 }, openness: 1.4 });
    const bottomRight = profile.apply({ pointer: { x: 0.8, y: 0.8 }, openness: 1.4 });
    expect(topLeft.pointer).toEqual({ x: 0, y: 0 });
    expect(bottomRight.pointer.x).toBeCloseTo(1);
    expect(bottomRight.pointer.y).toBeCloseTo(1);
  });

  it('gives silence for a fist and full volume for an open hand', () => {
    expect(profile.apply({ pointer: { x: 0.5, y: 0.5 }, openness: 0.9 }).volume).toBe(0);
    expect(profile.apply({ pointer: { x: 0.5, y: 0.5 }, openness: 2.0 }).volume).toBe(1);
  });

  it('works end to end with the feature extractor', () => {
    const extractor = new HandFeatureExtractor();
    const openHand = makeHand({ indexTip: { x: 0.8, y: 0.85 }, reach: 2 });
    const controls = profile.apply(extractor.extract(openHand));
    // The camera sees the fingertip on its right (x 0.8); the mirrored pointer is on the player's left.
    expect(controls.pointer.x).toBeCloseTo(0);
    expect(controls.pointer.y).toBeCloseTo(1);
    expect(controls.volume).toBe(1);
  });
});

describe('calibrationForSensitivity', () => {
  it('equals the default ranges at 0.5', () => {
    const p = calibrationForSensitivity(0.5);
    expect(p.pointerX.min).toBeCloseTo(0.2);
    expect(p.pointerX.max).toBeCloseTo(0.8);
    expect(p.pointerY.min).toBeCloseTo(0.2);
    expect(p.pointerY.max).toBeCloseTo(0.8);
  });

  it.each([0, 0.5, 1])('keeps the edges reachable at %s', (s) => {
    const p = calibrationForSensitivity(s);
    expect(p.pointerX.normalize(0.05)).toBeCloseTo(0, 5);
    expect(p.pointerX.normalize(0.95)).toBeCloseTo(1, 5);
    expect(p.pointerY.normalize(0.05)).toBeCloseTo(0, 5);
    expect(p.pointerY.normalize(0.95)).toBeCloseTo(1, 5);
  });

  it('needs less movement at High than at Low', () => {
    const low = calibrationForSensitivity(0).pointerX;
    const high = calibrationForSensitivity(1).pointerX;
    expect(high.max - high.min).toBeLessThan(low.max - low.min);
  });

  it.each([0, 0.5, 1])('keeps a fist silent and an open hand at full volume at %s', (s) => {
    const { openness } = calibrationForSensitivity(s);
    expect(openness.normalize(1.0)).toBe(0);
    expect(openness.normalize(1.8)).toBe(1);
  });

  it('never throws for out-of-range input', () => {
    expect(() => calibrationForSensitivity(-5)).not.toThrow();
    expect(() => calibrationForSensitivity(5)).not.toThrow();
  });
});
