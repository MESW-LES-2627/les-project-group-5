import type { InstrumentFrame, Scale } from '@instrument/domain';
import type { Synth } from './Synth';

/**
 * Connects the instrument's movement updates to the sound player.
 * When a frame says a degree has started, converts that degree in the current scale into a frequency and plays it.
 * It also updates the volume and stops the sound when the frame says to stop.
 */
export class SoundOutput {
  constructor(
    // The sound player that creates and controls the actual audio.
    private readonly synth: Synth,
    // The selected root note and note pattern used to calculate frequencies.
    private scale: Scale,
  ) {}

  /** Change the scale used to turn degrees into frequencies. */
  setScale(scale: Scale): void {
    this.scale = scale;
  }

  /** Handle one movement update from the instrument. */
  onFrame(frame: InstrumentFrame): void {
    if (frame.change.kind === 'start') {
      // A newly started degree needs a new sound at that degree's frequency.
      this.synth.noteOn(this.scale.frequencyOf(frame.change.degree));
    } else if (frame.change.kind === 'stop') {
      // Stop the current note when the instrument reports that it has stopped.
      this.synth.noteOff();
    }
    // Keep the sound level in sync with the instrument; force silence if no note is sounding.
    this.synth.setVolume(frame.sounding ? frame.volume : 0);
  }

  /** Stops the current note when the instrument screen is hidden. */
  stop(): void {
    this.synth.noteOff();
    this.synth.setVolume(0);
  }
}
