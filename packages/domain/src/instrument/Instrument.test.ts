import { describe, expect, it } from 'vitest';
import type { Point } from '../geometry/Point';
import type { Layout } from '../layouts/Layout';
import type { Degree } from '../music/Degree';
import { Instrument } from './Instrument';

/** A fake layout with two cells: left half is degree 1, right half is degree 2. */
const twoCells: Layout = {
  regions: () => [],
  hitTest: (point: Point): Degree => (point.x < 0.5 ? 1 : 2),
};

const LEFT = { x: 0.2, y: 0.5 };
const RIGHT = { x: 0.8, y: 0.5 };

describe('Instrument', () => {
  it('starts a note when the hand opens above the threshold', () => {
    const instrument = new Instrument(twoCells);
    const frame = instrument.update({ pointer: LEFT, volume: 0.6 });
    expect(frame.change).toEqual({ kind: 'start', degree: 1 });
    expect(frame.sounding).toBe(true);
    expect(frame.degree).toBe(1);
  });

  it('stays silent while the hand is closed, but still shows the selected cell', () => {
    const instrument = new Instrument(twoCells);
    const frame = instrument.update({ pointer: RIGHT, volume: 0.02 });
    expect(frame.change).toEqual({ kind: 'none' });
    expect(frame.sounding).toBe(false);
    expect(frame.degree).toBe(2);
  });

  it('keeps the note going (no change) while the hand stays in the same cell', () => {
    const instrument = new Instrument(twoCells);
    instrument.update({ pointer: LEFT, volume: 0.6 });
    const frame = instrument.update({ pointer: { x: 0.3, y: 0.4 }, volume: 0.9 });
    expect(frame.change).toEqual({ kind: 'none' });
    expect(frame.sounding).toBe(true);
    expect(frame.volume).toBe(0.9);
  });

  it('restarts the note when moving to another cell (retrigger)', () => {
    const instrument = new Instrument(twoCells);
    instrument.update({ pointer: LEFT, volume: 0.6 });
    expect(instrument.update({ pointer: RIGHT, volume: 0.6 }).change).toEqual({ kind: 'start', degree: 2 });
  });

  it('stops the note when the hand closes', () => {
    const instrument = new Instrument(twoCells);
    instrument.update({ pointer: LEFT, volume: 0.6 });
    const frame = instrument.update({ pointer: LEFT, volume: 0 });
    expect(frame.change).toEqual({ kind: 'stop' });
    expect(frame.sounding).toBe(false);
  });

  it('starts the same note again after closing and reopening the hand', () => {
    const instrument = new Instrument(twoCells);
    instrument.update({ pointer: LEFT, volume: 0.6 });
    instrument.update({ pointer: LEFT, volume: 0 });
    expect(instrument.update({ pointer: LEFT, volume: 0.6 }).change).toEqual({ kind: 'start', degree: 1 });
  });

  it('stops the note and reports no hand when the hand is lost', () => {
    const instrument = new Instrument(twoCells);
    instrument.update({ pointer: LEFT, volume: 0.6 });
    const frame = instrument.update(null);
    expect(frame).toMatchObject({ handDetected: false, pointer: null, degree: null, volume: 0, sounding: false });
    expect(frame.change).toEqual({ kind: 'stop' });
  });

  it('does not report a stop when nothing was playing', () => {
    const instrument = new Instrument(twoCells);
    expect(instrument.update(null).change).toEqual({ kind: 'none' });
  });

  it('stays silent outside the cells, even with an open hand', () => {
    const leftOnly: Layout = { regions: () => [], hitTest: (point) => (point.x < 0.5 ? 1 : null) };
    const instrument = new Instrument(leftOnly);
    const frame = instrument.update({ pointer: RIGHT, volume: 0.9 });
    expect(frame).toMatchObject({ handDetected: true, degree: null, sounding: false });
    expect(frame.change).toEqual({ kind: 'none' });
  });

  it('stops the note when the pointer leaves the cells', () => {
    const leftOnly: Layout = { regions: () => [], hitTest: (point) => (point.x < 0.5 ? 1 : null) };
    const instrument = new Instrument(leftOnly);
    instrument.update({ pointer: LEFT, volume: 0.9 });
    expect(instrument.update({ pointer: RIGHT, volume: 0.9 }).change).toEqual({ kind: 'stop' });
  });

  it('uses the new layout after setLayout', () => {
    const instrument = new Instrument(twoCells);
    const allThrees: Layout = { regions: () => [], hitTest: () => 3 };
    instrument.setLayout(allThrees);
    expect(instrument.update({ pointer: LEFT, volume: 0.6 }).degree).toBe(3);
  });
});
