import type { TrackedHand } from '@instrument/domain';
import type { HandTracker } from './HandTracker';

/**
 * A HandTracker for tests and demos without a camera: it returns whatever hands it was given.
 * Change them with setHands() between calls to simulate movement.
 */
export class FakeHandTracker implements HandTracker {
  private hands: TrackedHand[] = [];
  /** True after init() was called, so tests can check it. */
  initialized = false;

  async init(): Promise<void> {
    this.initialized = true;
  }

  /** Sets the hands that the next detect() calls will return. */
  setHands(hands: TrackedHand[]): void {
    this.hands = hands;
  }

  detect(_video: HTMLVideoElement, _timestampMs: number): TrackedHand[] {
    return this.hands;
  }
}
