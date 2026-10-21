import type { Handedness, TrackedHand } from './TrackedHand';

/**
 * Picks the player's dominant hand among the hands found in a frame.
 * The other hand is ignored, even if it is the only one in view (US-E5-03): then there is no hand to play with.
 */
export function pickHand(hands: readonly TrackedHand[], dominant: Handedness): TrackedHand | null {
  return hands.find((hand) => hand.handedness === dominant) ?? null;
}
