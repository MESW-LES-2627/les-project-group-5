import type { HandFeatures } from "../hand/HandFeatures";
import { ControlCalibration } from "./ControlCalibration";
import type { HandControls } from "./HandControls";

/**
 * How one person's hand movements map onto the play area and the volume: one range per control.
 *
 * The MVP has no calibration wizard, so the app uses DEFAULT_CALIBRATION_PROFILE.
 * A wizard can be added later: it would only create a different profile, and nothing else would change.
 */
export class CalibrationProfile {
  constructor(
    /** Range of the raw pointer x that covers the play area from left to right. */
    readonly pointerX: ControlCalibration,
    /** Range of the raw pointer y that covers the play area from top to bottom. */
    readonly pointerY: ControlCalibration,
    /** Range of hand openness, from closed fist (silent) to open hand (full volume). */
    readonly openness: ControlCalibration,
  ) {}

  /** Turns the raw hand features into controls from 0 to 1, using this person's ranges. */
  apply(features: HandFeatures): HandControls {
    return {
      pointer: {
        x: this.pointerX.normalize(features.pointer.x),
        y: this.pointerY.normalize(features.pointer.y),
      },
      volume: this.openness.normalize(features.openness),
    };
  }
}

/**
 * Default ranges, used by everyone in the MVP. Starting values, to be tuned in testing:
 * - Pointer: the middle 60% (x) and 70% (y) of the camera image cover the whole play area,
 *   so the player can reach the edge cells without the hand leaving the camera's view.
 * - Openness: about 1.0 for a fist and 1.8 for an open hand (see HandFeatures.openness).
 */
export const DEFAULT_CALIBRATION_PROFILE = new CalibrationProfile(
  new ControlCalibration(0.2, 0.8),
  new ControlCalibration(0.15, 0.85),
  new ControlCalibration(1.0, 1.8),
);

export const DEFAULT_SENSITIVITY = 0.5;

/** Pointer ranges are 1.5× wider at Low and 1.5× narrower at High, compared with the default. */
const RANGE_SPREAD = 1.5;
/** A range never gets wider than 0.05–0.95 of the camera image, so the edge cells stay reachable. */
const MAX_HALF_WIDTH = 0.45;
/** At High the open-hand end of the volume range is 1.55 instead of 1.8. */
const OPENNESS_MAX_AT_HIGH = 1.55;

function pointerRange(
  halfWidth: number,
  sensitivity: number,
): ControlCalibration {
  const half = Math.min(
    halfWidth * RANGE_SPREAD ** (1 - 2 * sensitivity),
    MAX_HALF_WIDTH,
  );
  return new ControlCalibration(0.5 - half, 0.5 + half);
}

/** The default profile with the ranges scaled for a sensitivity from 0 (Low) to 1 (High). */
export function calibrationForSensitivity(
  sensitivity: number,
): CalibrationProfile {
  const s = Math.min(1, Math.max(0, sensitivity));
  const { min, max } = DEFAULT_CALIBRATION_PROFILE.openness;
  const t = Math.max(0, (s - 0.5) * 2); // volume range only narrows above the default
  const openness = new ControlCalibration(
    min,
    max + (OPENNESS_MAX_AT_HIGH - max) * t,
  );
  return new CalibrationProfile(
    pointerRange(0.3, s),
    pointerRange(0.35, s),
    openness,
  );
}
