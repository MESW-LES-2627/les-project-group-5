import type { Handedness } from '@instrument/domain';

const KEY = 'instrument.hand';
const DEFAULT_HAND: Handedness = 'Right';

type HandListener = (hand: Handedness) => void;

/** Holds the player's settings. Pages report changes to it; the loop and the instrument page listen to it. */
export class SettingsStore {
  private current: Handedness = DEFAULT_HAND;
  private readonly listeners = new Set<HandListener>();

  get hand(): Handedness {
    return this.current;
  }

  setHand(hand: Handedness): void {
    if (hand === this.current) return;
    this.current = hand;
    for (const listener of [...this.listeners]) listener(hand);
  }

  /** Returns a function that removes the listener. */
  subscribe(listener: HandListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
