import { describe, expect, it } from 'vitest';
import { DEGREES, type Degree } from './Degree';
import { Scale } from './Scale';
import { ScaleType } from './ScaleType';

const cMajor = new Scale('C', ScaleType.MAJOR);
const gMajor = new Scale('G', ScaleType.MAJOR);
const aMinor = new Scale('A', ScaleType.NATURAL_MINOR);

// These tests check that a scale converts each of the instrument's eight
// degrees into the correct pitch, frequency, note name, and cell label.
describe('Scale', () => {
  // MIDI numbers represent pitches; each semitone increases the number by 1.
  describe('midiNoteOf', () => {
    // Check every degree in C major and A natural minor.
    it('C major: degrees 1 to 8 are MIDI 60 62 64 65 67 69 71 72', () => {
      expect(DEGREES.map((d) => cMajor.midiNoteOf(d))).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    });

    it('A natural minor: degrees 1 to 8 are MIDI 69 71 72 74 76 77 79 81', () => {
      expect(DEGREES.map((d) => aMinor.midiNoteOf(d))).toEqual([69, 71, 72, 74, 76, 77, 79, 81]);
    });

    // Check the root and octave for a key whose root is not C.
    it('B major: degree 1 is 71 (B4) and degree 8 is 83 (B5)', () => {
      const bMajor = new Scale('B', ScaleType.MAJOR);
      expect(bMajor.midiNoteOf(1)).toBe(71);
      expect(bMajor.midiNoteOf(8)).toBe(83);
    });
  });

  // Frequencies are calculated from MIDI pitches using A4 = 440 Hz.
  describe('frequencyOf', () => {
    // A natural minor starts on A, the 440 Hz tuning reference.
    it('A natural minor, degree 1 is 440 Hz', () => {
      expect(aMinor.frequencyOf(1)).toBe(440);
    });

    // Check C4 and the C one octave above; allow small rounding differences.
    it('C major, degree 1 is about 261.63 Hz and degree 8 about 523.25 Hz', () => {
      expect(cMajor.frequencyOf(1)).toBeCloseTo(261.63, 2);
      expect(cMajor.frequencyOf(8)).toBeCloseTo(523.25, 2);
    });
  });

  // The note names should reflect both the key and the scale type.
  describe('noteNameOf', () => {
    it('C major: C D E F G A B C', () => {
      expect(DEGREES.map((d) => cMajor.noteNameOf(d))).toEqual(['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C']);
    });

    it('G major: G A B C D E F# G', () => {
      expect(DEGREES.map((d) => gMajor.noteNameOf(d))).toEqual(['G', 'A', 'B', 'C', 'D', 'E', 'F#', 'G']);
    });

    it('A natural minor: A B C D E F G A', () => {
      expect(DEGREES.map((d) => aMinor.noteNameOf(d))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'A']);
    });
  });

  // Labels combine the degree number with its note name for display in a cell.
  describe('labelOf', () => {
    it('C major, degree 1 is "1 C"', () => {
      expect(cMajor.labelOf(1)).toBe('1 C');
    });

    it('G major, degree 7 is "7 F#"', () => {
      expect(gMajor.labelOf(7)).toBe('7 F#');
    });
  });

  // TypeScript prevents invalid degrees in normal code, but runtime inputs
  // can still be invalid, so each public conversion method must reject them.
  describe('invalid degrees', () => {
    it('throws a RangeError for 0, 9 and 2.5', () => {
      // Cast only to let invalid numbers reach the runtime validation.
      for (const bad of [0, 9, 2.5]) {
        expect(() => cMajor.midiNoteOf(bad as Degree)).toThrow(RangeError);
        expect(() => cMajor.frequencyOf(bad as Degree)).toThrow(RangeError);
        expect(() => cMajor.noteNameOf(bad as Degree)).toThrow(RangeError);
        expect(() => cMajor.labelOf(bad as Degree)).toThrow(RangeError);
      }
    });
  });
});
