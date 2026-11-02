import type { Landmark, TrackedHand } from './TrackedHand';
import type { HandFeatures } from './HandFeatures';
import { HandLandmark, LANDMARK_COUNT } from './HandLandmark';

const FINGERTIPS = [HandLandmark.INDEX_TIP, HandLandmark.MIDDLE_TIP, HandLandmark.RING_TIP, HandLandmark.PINKY_TIP];

/**
 * Turns a tracked hand into the two values the instrument needs: where the pointer is and how open the hand is.
 *
 * - The pointer is mirrored (x → 1 − x), because the player sees the camera image as a mirror:
 *   moving the hand to the right must move the pointer to the right.
 * - Openness uses the world landmarks (metres), so it doesn't change with the camera's aspect ratio
 *   or with how far the hand is from the camera. The thumb is left out: it moves sideways more than it opens.
 */
export class HandFeatureExtractor {
  /** Reads the pointer and openness from one hand. Throws a RangeError if a landmark list doesn't have 21 points. */
  extract(hand: TrackedHand): HandFeatures {
    checkLandmarks(hand.landmarks, 'landmarks');
    checkLandmarks(hand.worldLandmarks, 'worldLandmarks');

    const tip = hand.landmarks[HandLandmark.INDEX_TIP];
    return {
      pointer: { x: 1 - tip.x, y: tip.y },
      openness: this.openness(hand.worldLandmarks),
    };
  }

  private openness(world: readonly Landmark[]): number {
    const wrist = world[HandLandmark.WRIST];
    const palmSize = distance(wrist, world[HandLandmark.MIDDLE_BASE]);
    if (palmSize === 0) {
      return 0;
    }
    const averageReach = FINGERTIPS.reduce((sum, index) => sum + distance(wrist, world[index]), 0) / FINGERTIPS.length;
    return averageReach / palmSize;
  }
}

function checkLandmarks(landmarks: readonly Landmark[], name: string): void {
  if (landmarks.length !== LANDMARK_COUNT) {
    throw new RangeError(`Expected ${LANDMARK_COUNT} ${name}, got ${landmarks.length}`);
  }
}

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}
