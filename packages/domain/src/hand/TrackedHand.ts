/** One hand point found by the tracker. */
export interface Landmark {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export type Handedness = "Left" | "Right";

/**
 * A hand found in one camera frame. This is the project's own type:
 * the tracking adapter converts the library's result into it, so the core rules never depend on the library.
 */
export interface TrackedHand {
  /** The player's real hand (already corrected by the adapter if the library reports it mirrored). */
  readonly handedness: Handedness;
  /**
   * The 21 landmarks in image coordinates: x and y from 0 to 1 across the camera image, as the camera sees it
   * (not mirrored). Order: see HandLandmark.
   */
  readonly landmarks: readonly Landmark[];
  /** The same 21 landmarks in metres, centred on the hand. Distances here don't depend on the image size. */
  readonly worldLandmarks: readonly Landmark[];
}
