import {
  pickHand,
  type CalibrationProfile,
  type HandFeatureExtractor,
  type Handedness,
  type Instrument,
  type InstrumentFrame,
} from '@instrument/domain';
import type { HandTracker } from '../tracking/HandTracker';

/** Something that receives every instrument frame, like the sound output or the page. */
export type FrameListener = (frame: InstrumentFrame) => void;
export type FrameErrorListener = (error: unknown) => void;

/** The video has data for the current frame (HTMLMediaElement.HAVE_CURRENT_DATA). */
const HAVE_CURRENT_DATA = 2;

/**
 * The real-time loop: on every new camera frame it runs the pipeline
 *   tracker → dominant hand → features → calibration → instrument rules
 * and hands the resulting frame to every listener (sound, screen).
 *
 * The loop doesn't know what the listeners do (Observer), so adding a new one,
 * like the game or a debug view, doesn't change this class.
 */
export class InstrumentLoop {
  private readonly listeners: FrameListener[] = [];
  private readonly errorListeners = new Set<FrameErrorListener>();
  private animationFrame: number | null = null;
  private lastVideoTime = -1;

  constructor(
    private readonly tracker: HandTracker,
    private readonly extractor: HandFeatureExtractor,
    private readonly profile: CalibrationProfile,
    private readonly instrument: Instrument,
    private readonly video: HTMLVideoElement,
    private dominantHand: Handedness = 'Right',
  ) {}

  /** Changes which hand drives the instrument. Takes effect on the next processed frame. */
  setDominantHand(hand: Handedness): void {
    this.dominantHand = hand;
  }

  /** Adds a listener. Returns a function that removes it. */
  subscribe(listener: FrameListener): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index >= 0) this.listeners.splice(index, 1);
    };
  }

  /** Adds a listener for errors that stop real-time processing. */
  subscribeError(listener: FrameErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  /** Starts processing camera frames. Calling it again while running does nothing. */
  start(): void {
    if (this.animationFrame !== null) return;
    const step = (now: number) => {
      try {
        this.tick(now);
      } catch (error) {
        this.animationFrame = null;
        for (const listener of this.errorListeners) listener(error);
        return;
      }
      this.animationFrame = requestAnimationFrame(step);
    };
    this.animationFrame = requestAnimationFrame(step);
  }

  /** Stops processing camera frames. */
  stop(): void {
    if (this.animationFrame !== null) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }

  /** One step of the loop. Public so tests can run it without requestAnimationFrame. */
  tick(nowMs: number): void {
    // Screens refresh faster than cameras: only process a frame when the camera has a new one.
    if (this.video.readyState < HAVE_CURRENT_DATA || this.video.currentTime === this.lastVideoTime) {
      return;
    }
    this.lastVideoTime = this.video.currentTime;

    const hand = pickHand(this.tracker.detect(this.video, nowMs), this.dominantHand);
    const controls = hand ? this.profile.apply(this.extractor.extract(hand)) : null;
    const frame = this.instrument.update(controls);
    for (const listener of this.listeners) {
      listener(frame);
    }
  }
}
