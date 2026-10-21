import type { Handedness } from '@instrument/domain';

/**
 * Turns MediaPipe's handedness label into the player's real hand.
 *
 * We give MediaPipe the camera image as it is (not mirrored), and its labels already match the player's real hand:
 * "Right" is the right hand. This was checked with a real camera on 19 Oct. An earlier version swapped the labels,
 * and the player had to raise the left hand to play.
 *
 * Returns null for an unknown label, so that hand is ignored instead of guessed.
 */
export function toPlayerHandedness(label: string | undefined): Handedness | null {
  if (label === 'Right' || label === 'Left') {
    return label;
  }
  return null;
}
