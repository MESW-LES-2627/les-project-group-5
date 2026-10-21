/**
 * The 12 note names in one octave in english. 
 * C, D, E, F, G, A, B = Dó, Ré, Mi, Fá, Sol, Lá, Si.
 * # marks the notes between some of those notes (the black keys of the piano).
 * The pattern repeats each octave, so these names do not include an octave number.
 */

// The 12 note names in one octave in english.
export const PITCH_CLASSES = [
  'C',  // Dó
  'C#', // Dó sharp/sustenido = Ré flat/bemol
  'D',  // Ré
  'D#', // Ré sharp/sustenido = Mi flat/bemol
  'E',  // Mi
  'F',  // Fá
  'F#', // Fá sharp/sustenido = Sol flat/bemol
  'G',  // Sol
  'G#', // Sol sharp/sustenido = Lá flat/bemol
  'A',  // Lá
  'A#', // Lá sharp/sustenido = Si flat/bemol
  'B',  // Si
] as const;

// Restricts PitchClass to the exact note names listed above.
export type PitchClass = (typeof PITCH_CLASSES)[number];
