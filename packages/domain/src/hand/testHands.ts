import { HandLandmark, LANDMARK_COUNT } from './HandLandmark';
import type { Handedness, Landmark, TrackedHand } from './TrackedHand';

/** Test helper: builds a simple, synthetic hand. Not used by the app. */
export function makeHand(options: {
  handedness?: Handedness;
  /** Index fingertip in image coordinates (not mirrored). */
  indexTip?: { x: number; y: number };
  /** Distance from the wrist to each fingertip, in palm sizes (about 1 = fist, 2 = open). */
  reach?: number;
  /** Palm size in metres (wrist to middle-finger base). */
  palmSize?: number;
}): TrackedHand {
  const { handedness = 'Right', indexTip = { x: 0.5, y: 0.5 }, reach = 2, palmSize = 0.09 } = options;

  const landmarks: Landmark[] = Array.from({ length: LANDMARK_COUNT }, () => ({ x: 0.5, y: 0.6, z: 0 }));
  landmarks[HandLandmark.INDEX_TIP] = { ...indexTip, z: 0 };

  // World landmarks: wrist at the origin, the hand pointing up (negative y), fingertips spread a little sideways.
  const world: Landmark[] = Array.from({ length: LANDMARK_COUNT }, () => ({ x: 0, y: 0, z: 0 }));
  world[HandLandmark.MIDDLE_BASE] = { x: 0, y: -palmSize, z: 0 };
  const tips = [HandLandmark.INDEX_TIP, HandLandmark.MIDDLE_TIP, HandLandmark.RING_TIP, HandLandmark.PINKY_TIP];
  const angles = [-0.2, 0, 0.2, 0.4];
  tips.forEach((index, i) => {
    const length = reach * palmSize;
    world[index] = { x: Math.sin(angles[i]) * length, y: -Math.cos(angles[i]) * length, z: 0 };
  });

  return { handedness, landmarks, worldLandmarks: world };
}
