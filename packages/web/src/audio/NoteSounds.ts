import type { Degree } from '@instrument/domain';

/** How one note sounds. Each of the 8 degrees has its own sound, so the player can hear which pad is playing. */
export interface NoteSound {
  /** Shape of the sound wave; it sets the character of the tone. */
  readonly waveform: OscillatorType;
  /** Frequencies above this are removed: a low value is soft and dark, a high value is bright. */
  readonly cutoffHz: number;
  /** Seconds to fade in (short = sharp start) and fade out (long = the note lingers). */
  readonly attackSeconds: number;
  readonly releaseSeconds: number;
}

/** The sound of each degree, from 1 (darkest and softest) to 8 (brightest). */
export const NOTE_SOUNDS: Record<Degree, NoteSound> = {
  1: { waveform: 'sine', cutoffHz: 1500, attackSeconds: 0.04, releaseSeconds: 0.15 }, // warm, soft
  2: { waveform: 'triangle', cutoffHz: 2000, attackSeconds: 0.02, releaseSeconds: 0.1 }, // flute-like
  3: { waveform: 'square', cutoffHz: 1200, attackSeconds: 0.01, releaseSeconds: 0.08 }, // hollow, retro
  4: { waveform: 'sawtooth', cutoffHz: 1600, attackSeconds: 0.03, releaseSeconds: 0.12 }, // string-like
  5: { waveform: 'triangle', cutoffHz: 3500, attackSeconds: 0.005, releaseSeconds: 0.2 }, // bell-like
  6: { waveform: 'sawtooth', cutoffHz: 2500, attackSeconds: 0.005, releaseSeconds: 0.05 }, // buzzy, short
  7: { waveform: 'square', cutoffHz: 3000, attackSeconds: 0.005, releaseSeconds: 0.06 }, // bright, punchy
  8: { waveform: 'sine', cutoffHz: 6000, attackSeconds: 0.01, releaseSeconds: 0.3 }, // clear, glassy
};
