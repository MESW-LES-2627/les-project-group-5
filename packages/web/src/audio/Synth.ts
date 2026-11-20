/**
 * Describes the basic actions needed to play one note at a time.
 * SoundOutput uses this interface without needing to know how audio is created.
 * Only the implementation of this interface may use the browser's Web Audio API.
 */
export interface Synth {
  /**
   * Prepare or enable audio playback.
   * Browsers require this to happen after a user action, such as clicking Start.
   */
  start(): Promise<void>;

  /**
   * Play a note at the given frequency in hertz (nº of oscillations per second).
   * Replace any note that is already playing.
   */
  noteOn(frequencyHz: number): void;

  /** Fade out and stop the note that is currently playing. */
  noteOff(): void;

  /**
   * Set the volume: 0 is silent and 1 is the maximum level.
   * Smooth changes so sudden volume jumps do not make unwanted clicks.
   */
  setVolume(volume: number): void;
}
