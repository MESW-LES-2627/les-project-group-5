import type { PitchClass } from '@instrument/domain';

/** The Portuguese name of each note (Dó, Ré, Mi…), shown under the letter on a pad. # is sustenido. */
const SOLFEGE: Record<PitchClass, string> = {
  C: 'Dó',
  'C#': 'Dó#',
  D: 'Ré',
  'D#': 'Ré#',
  E: 'Mi',
  F: 'Fá',
  'F#': 'Fá#',
  G: 'Sol',
  'G#': 'Sol#',
  A: 'Lá',
  'A#': 'Lá#',
  B: 'Si',
};

export function solfegeOf(note: PitchClass): string {
  return SOLFEGE[note];
}
