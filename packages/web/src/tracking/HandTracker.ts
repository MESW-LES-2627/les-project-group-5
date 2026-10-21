import type { TrackedHand } from '@instrument/domain';

/**
 * Finds hands in camera frames.
 * Only the adapter that implements this interface may import the tracking library (MediaPipe).
 * Tests use a fake implementation, so no camera is needed.
 */
export interface HandTracker {
  /** Loads the model. Call once before detect(). */
  init(): Promise<void>;

  /** The hands found in the current video frame (empty if none). */
  detect(video: HTMLVideoElement, timestampMs: number): TrackedHand[];
}
