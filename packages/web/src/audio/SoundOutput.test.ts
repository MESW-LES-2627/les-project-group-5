import { describe, expect, it } from 'vitest';
import { Scale, ScaleType, type Degree, type InstrumentFrame } from '@instrument/domain';
import { SoundOutput } from './SoundOutput';
import { NOTE_SOUNDS, type NoteSound } from './NoteSounds';
import type { Synth } from './Synth';

/**
 * A fake sound player for tests. It records requested actions instead of
 * producing audio, so tests can check what SoundOutput would ask a real player to do.
 */
class RecordingSynth implements Synth {
  calls: string[] = [];
  // Starting audio is unnecessary in these tests, so the fake resolves immediately.
  async start(): Promise<void> {}
  noteOn(frequencyHz: number, sound: NoteSound): void {
    this.calls.push(`noteOn ${frequencyHz} ${sound.waveform}`);
  }
  noteOff(): void {
    this.calls.push('noteOff');
  }
  setVolume(volume: number): void {
    this.calls.push(`volume ${volume}`);
  }
}

/**
 * A predictable test scale: each degree maps to degree × 100 Hz.
 * This makes the expected frequency easy to see without testing scale calculations here.
 */
class HundredsScale extends Scale {
  constructor() {
    super('C', ScaleType.MAJOR);
  }
  override frequencyOf(degree: Degree): number {
    return degree * 100;
  }
}

/** Create a typical instrument update, replacing any fields specified by a test. */
function frame(overrides: Partial<InstrumentFrame>): InstrumentFrame {
  return { handDetected: true, pointer: { x: 0.5, y: 0.5 }, degree: 1, volume: 0.5, sounding: true, change: { kind: 'none' }, ...overrides };
}

// Verify that instrument updates are translated into the expected sound-player actions.
describe('SoundOutput', () => {
  // Starting degree 3 should play 300 Hz with the frame's volume of 0.7.
  it('starts a note at the frequency of its degree, with the sound of that degree, and sets the volume', () => {
    const synth = new RecordingSynth();
    new SoundOutput(synth, new HundredsScale()).onFrame(frame({ change: { kind: 'start', degree: 3 }, volume: 0.7 }));
    expect(synth.calls).toEqual([`noteOn 300 ${NOTE_SOUNDS[3].waveform}`, 'volume 0.7']);
  });

  // With no start or stop event, leave the current note alone and only update volume.
  it('only updates the volume while a note keeps sounding', () => {
    const synth = new RecordingSynth();
    new SoundOutput(synth, new HundredsScale()).onFrame(frame({ volume: 0.4 }));
    expect(synth.calls).toEqual(['volume 0.4']);
  });

  // A stop event ends the note, and a frame that is no longer sounding sets volume to zero.
  it('stops the note and silences the volume', () => {
    const synth = new RecordingSynth();
    new SoundOutput(synth, new HundredsScale()).onFrame(frame({ change: { kind: 'stop' }, sounding: false, volume: 0.3 }));
    expect(synth.calls).toEqual(['noteOff', 'volume 0']);
  });

  it('stops and silences the sound when leaving the instrument screen', () => {
    const synth = new RecordingSynth();
    new SoundOutput(synth, new HundredsScale()).stop();
    expect(synth.calls).toEqual(['noteOff', 'volume 0']);
  });
});

// Each pad should be recognisable by ear, so no two degrees may share exactly the same sound.
describe('NOTE_SOUNDS', () => {
  it('gives each of the 8 degrees a different sound', () => {
    const unique = new Set(Object.values(NOTE_SOUNDS).map((s) => JSON.stringify(s)));
    expect(unique.size).toBe(8);
  });
});
