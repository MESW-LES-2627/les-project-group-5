import type { TrackedHand } from '@instrument/domain';
import type { HandTracker } from './HandTracker';

/**
 * A HandTracker for tests and demos without a camera: it returns whatever hands it was given.
 * Change them with setHands() between calls to simulate movement.
 */
export class FakeHandTracker implements HandTracker {
  private hands: TrackedHand[] = [];
  initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }

  setHands(hands: TrackedHand[]): void {
    this.hands = hands;
  }

  detect(_video: HTMLVideoElement, _timestampMs: number): TrackedHand[] {
    return this.hands;
  }
}
