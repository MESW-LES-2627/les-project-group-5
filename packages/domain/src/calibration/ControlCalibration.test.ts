import { describe, expect, it } from 'vitest';
import { ControlCalibration } from './ControlCalibration';

describe('ControlCalibration', () => {
  const range = new ControlCalibration(1, 2);

  it('maps the minimum to 0, the maximum to 1 and the middle to 0.5', () => {
    expect(range.normalize(1)).toBe(0);
    expect(range.normalize(2)).toBe(1);
    expect(range.normalize(1.5)).toBe(0.5);
  });

  it('clamps values outside the range', () => {
    expect(range.normalize(0.3)).toBe(0);
    expect(range.normalize(5)).toBe(1);
  });

  it('rejects a minimum that is not lower than the maximum', () => {
    expect(() => new ControlCalibration(2, 1)).toThrow(RangeError);
    expect(() => new ControlCalibration(1, 1)).toThrow(RangeError);
  });

  it('rejects values that are not finite numbers', () => {
    expect(() => new ControlCalibration(Number.NaN, 1)).toThrow(RangeError);
    expect(() => new ControlCalibration(0, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
