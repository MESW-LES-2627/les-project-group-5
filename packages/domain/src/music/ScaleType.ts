/**
 * Describes a scale pattern, such as major or natural minor.
 * In the future, more scale types can be added, such as harmonic minor, melodic minor, pentatonic, etc.
 * A scale is a set of notes played in order. The intervals below say how far
 * each note is from the starting note (the root), measured in semitones.
 * A semitone is the distance from one piano key to the next, including black keys.
 */

export class ScaleType {
  // The major pattern: distances from the root for each note, ending at the root one octave higher.
  // This corresponds to the white keys of the piano
  static readonly MAJOR = new ScaleType('Major', [0, 2, 4, 5, 7, 9, 11, 12]);

  // The natural minor pattern uses different distances, which gives it a different sound.
  // Some corresponds to the white keys, some to the black keys of the piano
  static readonly NATURAL_MINOR = new ScaleType('Natural minor', [0, 2, 3, 5, 7, 8, 10, 12]);

  private constructor(
    // The scale name shown to people.
    readonly name: string,
    // Semitone distances from the root, in order; 0 is the root and 12 is the next octave.
    readonly intervals: readonly number[],
  ) {}
}
