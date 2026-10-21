import type { HandControls } from '../calibration/HandControls';
import type { Layout } from '../layouts/Layout';
import type { Degree } from '../music/Degree';
import type { InstrumentFrame, NoteChange } from './InstrumentFrame';

/** Below this volume the hand is "closed" and no note sounds (about 5%, from the proposal). */
export const DEFAULT_VOLUME_THRESHOLD = 0.05;

/**
 * The rules of playing: which note is selected, and when a note starts or stops.
 * - A note sounds while the pointer is on a cell and the volume is above the threshold.
 * - Moving to another cell while sounding restarts the note on the new degree (retrigger).
 * - Leaving the cells, closing the hand or losing the hand stops the note.
 *
 * It only decides; it doesn't make sound or draw. Whoever listens to the frames does that.
 * Hysteresis is planned: on the volume threshold in Iteration 1 (start above 0.06, stop below 0.03)
 * and on cell borders later.
 */
export class Instrument {
  private playingDegree: Degree | null = null;

  constructor(
    private layout: Layout,
    private readonly volumeThreshold = DEFAULT_VOLUME_THRESHOLD,
  ) {}

  setLayout(layout: Layout): void {
    this.layout = layout;
  }

  update(controls: HandControls | null): InstrumentFrame {
    if (!controls) {
      return this.frame(false, null, null, 0, this.stopIfPlaying());
    }

    const degree = this.layout.hitTest(controls.pointer);
    const shouldSound = degree !== null && controls.volume > this.volumeThreshold;

    let change: NoteChange = { kind: 'none' };
    if (!shouldSound) {
      change = this.stopIfPlaying();
    } else if (this.playingDegree !== degree) {
      this.playingDegree = degree;
      change = { kind: 'start', degree };
    }
    return this.frame(true, controls.pointer, degree, controls.volume, change);
  }

  private stopIfPlaying(): NoteChange {
    if (this.playingDegree === null) {
      return { kind: 'none' };
    }
    this.playingDegree = null;
    return { kind: 'stop' };
  }

  private frame(
    handDetected: boolean,
    pointer: InstrumentFrame['pointer'],
    degree: Degree | null,
    volume: number,
    change: NoteChange,
  ): InstrumentFrame {
    return { handDetected, pointer, degree, volume, sounding: this.playingDegree !== null, change };
  }
}
