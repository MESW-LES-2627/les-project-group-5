/**
 * The range of one raw control value (for example hand openness), and how to turn it into 0–1.
 *
 * Values at or below `min` become 0, at or above `max` become 1, and values in between are scaled linearly.
 * A value object: it never changes after it is created, and an invalid range can't be created.
 */
export class ControlCalibration {
  constructor(
    /** Raw value that becomes 0. */
    readonly min: number,
    /** Raw value that becomes 1. Must be greater than `min`. */
    readonly max: number,
  ) {
    if (!Number.isFinite(min) || !Number.isFinite(max)) {
      throw new RangeError(`Calibration range must be finite numbers, got ${min}..${max}`);
    }
    if (min >= max) {
      throw new RangeError(`Calibration minimum must be lower than the maximum, got ${min}..${max}`);
    }
  }

  /** Scales a raw value into 0–1, clamping values outside the range. */
  normalize(raw: number): number {
    const scaled = (raw - this.min) / (this.max - this.min);
    return Math.min(1, Math.max(0, scaled));
  }
}
