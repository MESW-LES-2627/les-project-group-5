import type { Synth } from './Synth';

/** Fixed tone settings shared by every note; pads change pitch only. */
const WAVEFORM: OscillatorType = 'triangle';
const FILTER_CUTOFF_HZ = 3000;
const ATTACK_SECONDS = 0.01;
const RELEASE_SECONDS = 0.05;
/** How quickly volume follows movement; smoothing prevents abrupt level changes. */
const VOLUME_SMOOTHING_SECONDS = 0.03;

/** The two browser audio components created for each individual note. */
interface Voice {
  /** Generates the tone at the requested frequency. */
  readonly oscillator: OscillatorNode;
  /** Controls the note's fade in and fade out. */
  readonly envelope: GainNode;
}

/**
 * Creates and controls sound using the browser's Web Audio API.
 * The only file in the project allowed to use the Web Audio API (enforced by ESLint).
 *
 * Sound path: tone generator → note fade → tone filter → overall volume → speakers.
 * Each note gets its own tone generator and fade control; the filter and overall
 * volume are shared so they can be reused between notes.
 */
export class WebAudioSynth implements Synth {
  // These are created when playback starts; null means audio is not ready yet.
  private context: AudioContext | null = null;
  private filter: BiquadFilterNode | null = null;
  private master: GainNode | null = null;
  // There can be only one active note at a time.
  private voice: Voice | null = null;

  /** Create the shared audio components once, then enable the browser's audio context. */
  async start(): Promise<void> {
    if (!this.context) {
      // The context is the browser's audio workspace; audio nodes are created inside it.
      const context = new AudioContext();

      // Filter the generated tone, then route it through the overall volume to the speakers.
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = FILTER_CUTOFF_HZ;
      const master = context.createGain();
      // Start silent until a note and its volume are set.
      master.gain.value = 0;
      filter.connect(master).connect(context.destination);

      // Save these shared components so later notes can reuse them.
      this.context = context;
      this.filter = filter;
      this.master = master;
    }
    // Browsers keep audio suspended until a user action (like clicking Start) resumes it.
    await this.context.resume();
  }

  /** Start a tone at the requested frequency, replacing any note already playing. */
  noteOn(frequencyHz: number): void {
    const { context, filter } = this.ready();
    // Fade out the previous tone before replacing it.
    this.releaseVoice();

    const now = context.currentTime;
    // An oscillator generates a repeating sound wave; its frequency sets the pitch.
    const oscillator = context.createOscillator();
    oscillator.type = WAVEFORM;
    oscillator.frequency.value = frequencyHz;

    // The envelope controls how quickly this note fades in and out.
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(1, now + ATTACK_SECONDS);

    // Send this note through its fade control and the shared filter to the output.
    oscillator.connect(envelope).connect(filter);
    oscillator.start(now);
    this.voice = { oscillator, envelope };
  }

  /** Fade out and stop whichever note is currently playing. */
  noteOff(): void {
    this.ready();
    this.releaseVoice();
  }

  /** Set the shared output volume, limiting values to the supported 0-to-1 range. */
  setVolume(volume: number): void {
    const { context, master } = this.ready();
    const clamped = Math.min(1, Math.max(0, volume));
    master.gain.setTargetAtTime(clamped, context.currentTime, VOLUME_SMOOTHING_SECONDS);
  }

  /** Fade out the active note, stop its tone generator, and release its audio resources. */
  private releaseVoice(): void {
    if (!this.voice || !this.context) {
      return;
    }
    const { oscillator, envelope } = this.voice;
    const now = this.context.currentTime;
    // Replace any pending fade instructions with a short fade to silence.
    envelope.gain.cancelScheduledValues(now);
    envelope.gain.setValueAtTime(envelope.gain.value, now);
    envelope.gain.linearRampToValueAtTime(0, now + RELEASE_SECONDS);
    oscillator.stop(now + RELEASE_SECONDS);
    // Disconnect the per-note audio components after the fade has finished.
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
    this.voice = null;
  }

  /** Return the shared audio components, or report that start() was not called yet. */
  private ready(): { context: AudioContext; filter: BiquadFilterNode; master: GainNode } {
    if (!this.context || !this.filter || !this.master) {
      throw new Error('WebAudioSynth used before start()');
    }
    return { context: this.context, filter: this.filter, master: this.master };
  }
}
