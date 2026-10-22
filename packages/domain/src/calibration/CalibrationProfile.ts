import type { HandFeatures } from '../hand/HandFeatures';
import { ControlCalibration } from './ControlCalibration';
import type { HandControls } from './HandControls';

/**
 * How one person's hand movements map onto the play area and the volume: one range per control.
 *
 * The MVP has no calibration wizard, so the app uses DEFAULT_CALIBRATION_PROFILE.
 * A wizard can be added later: it would only create a different profile, and nothing else would change.
 */
export class CalibrationProfile {
  constructor(
    readonly pointerX: ControlCalibration,
    readonly pointerY: ControlCalibration,
    readonly openness: ControlCalibration,
  ) {}

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
