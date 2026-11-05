/**
 * A point on the play area, in normalized coordinates:
 * x goes from 0 (left) to 1 (right), y goes from 0 (top) to 1 (bottom).
 */
export interface Point {
  /** From 0 (left) to 1 (right). */
  readonly x: number;
  /** From 0 (top) to 1 (bottom). */
  readonly y: number;
}
