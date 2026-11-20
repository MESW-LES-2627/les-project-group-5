import type { Point } from '../geometry/Point';
import { DEFAULT_SENSITIVITY } from './CalibrationProfile';

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;

/** Less sensitivity means a steadier pointer: more smoothing and a bigger dead zone. */
export function smoothingFor(sensitivity: number) {
  const s = Math.min(1, Math.max(0, sensitivity));
  return {
    /** Share of the distance to the target covered each frame (1 = no smoothing). */
    alpha: lerp(0.3, 0.8, s),
    /** The hand must move more than this (play-area units) before the target moves. */
    deadZone: lerp(0.02, 0.004, s),
  };
}

/** Steadies the pointer: ignores tiny jitter and eases toward the hand. */
export class PointerSmoother {
  private smoother = smoothingFor(DEFAULT_SENSITIVITY);
  /** The last raw position that moved more than the dead zone. */
  private target: Point | null = null;
  private shown: Point | null = null;

  setSensitivity(sensitivity: number): void {
    this.smoother = smoothingFor(sensitivity);
  }

  /** Forgets the last position, so the next pointer appears where the hand is. */
  reset(): void {
    this.target = null;
    this.shown = null;
  }

  apply(raw: Point): Point {
    if (!this.target || !this.shown) {
      this.target = { ...raw };
      this.shown = { ...raw };
      return { ...raw };
    }
    if (Math.hypot(raw.x - this.target.x, raw.y - this.target.y) >= this.smoother.deadZone) {
      this.target = { ...raw };
    }
    const { alpha } = this.smoother;
    this.shown = {
      x: this.shown.x + alpha * (this.target.x - this.shown.x),
      y: this.shown.y + alpha * (this.target.y - this.shown.y),
    };
    return { ...this.shown };
  }
}
