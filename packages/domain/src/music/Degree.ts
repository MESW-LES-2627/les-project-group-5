/** 
 * Represents a position or key in the instrument's eight-note range, not a fixed note.
 * The same degree can map to different notes when the key or scale changes, 
 * so exercises can be transposed to different keys without changing their degree sequence.
 * Degree 1 is the root note; degree 8 is the root one octave higher.
 */

// Only the eight positions represented by the instrument's UI are valid degrees.
export type Degree = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

// The degrees in ascending order, useful when iterating over all eight positions.
export const DEGREES: readonly Degree[] = [1, 2, 3, 4, 5, 6, 7, 8];

// Checks whether a number is a valid degree: a whole number from 1 to 8.
// Use this for values from sources like user input that may not be valid.
export function isDegree(value: number): value is Degree {
  return Number.isInteger(value) && value >= 1 && value <= 8;
}