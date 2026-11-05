import { isDegree, type Degree } from './Degree';
import { PITCH_CLASSES, type PitchClass } from './PitchClass';
import type { ScaleType } from './ScaleType';

/** MIDI number of C4 / Dó4 (middle C / Dó on piano). Degree 1 is placed in the octave from C4 to B4. */
const MIDI_C4 = 60;
/** MIDI number and frequency of A4 / Lá4, the tuning reference. */
/** The standard tuning frequency for A4 / Lá4 is 440 Hz, but some people tune instruments slightly higher or lower. */
const MIDI_A4 = 69;
const FREQUENCY_A4 = 440; 

/**
 * Turns a degree (a position from 1 to 8) into a MIDI note using the scale's
 * root note (PitchClass) and note pattern (ScaleType). It also calculates the
 * frequency in hertz for the synth or sound engine, the note name, and a label
 * for the user interface.
 *
 * A scale is an ordered group of notes built from a starting note (the root)
 * and a pattern that determines the distance between notes. MIDI is a standard
 * way for music software and instruments to represent notes as numbers.
 *
 * For example, in C major / Dó major, degree 1 is C4 / Dó4, represented by MIDI note 60.
 * Every method throws a RangeError if the degree is not a whole number from 1 to 8.
 */
export class Scale {
  /** Creates a scale by saving its starting note (root) and note pattern (type). */
  constructor(
    /** The starting note of the scale (degree 1). */
    readonly root: PitchClass,
    /** The pattern of distances between the notes. */
    readonly type: ScaleType,
  ) {}

  /** MIDI note number of a degree. Example: C major / Dó major, degree 1 → 60. */
  midiNoteOf(degree: Degree): number {
    this.checkDegree(degree);
    const rootMidi = MIDI_C4 + PITCH_CLASSES.indexOf(this.root);
    return rootMidi + this.type.intervals[degree - 1];
  }

  /**
   * Converts the degree's MIDI number to frequency using A4 / Lá4 (MIDI 69) as the 440 Hz reference. 
   * Each 12-step MIDI difference is one octave, so the frequency doubles above A4 and halves below it. 
   * The result is in hertz.
   */
  frequencyOf(degree: Degree): number {
    return FREQUENCY_A4 * 2 ** ((this.midiNoteOf(degree) - MIDI_A4) / 12);
  }

  /** Note name of a degree, without octave. Example: For the key of G major / Sol major, degree 7 → "F#". */
  noteNameOf(degree: Degree): PitchClass {
    return PITCH_CLASSES[this.midiNoteOf(degree) % 12];
  }

  /** Text shown on a cell. Example: C major / Dó major, degree 1 → "1 C". */
  labelOf(degree: Degree): string {
    return `${degree} ${this.noteNameOf(degree)}`;
  }

  /** Stop the calculation if the degree is not a whole number from 1 to 8. */
  private checkDegree(degree: number): void {
    if (!isDegree(degree)) {
      throw new RangeError(`A degree must be a whole number from 1 to 8, got ${degree}`);
    }
  }
}
