import { describe, expect, it } from 'vitest';
import { Scale } from '../music/Scale';
import { ScaleType } from '../music/ScaleType';
import { PianoLayout } from './PianoLayout';

describe('PianoLayout', () => {
  it('shows 13 semitone keys from the selected root through its octave', () => {
    const keys = new PianoLayout().keys(new Scale('C', ScaleType.MAJOR));

    expect(keys.map((key) => key.note)).toEqual([
      'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'C',
    ]);
  });

  it('keeps pitch identity when the selected root starts on a black key', () => {
    const keys = new PianoLayout().keys(new Scale('C#', ScaleType.MAJOR));

    expect(keys[0]).toMatchObject({ note: 'C#', color: 'black', degree: 1, x: 0 });
    expect(keys[12]).toMatchObject({ note: 'C#', color: 'black', degree: 8 });
    expect(keys[1]).toMatchObject({ note: 'D', color: 'white', degree: null });
  });

  it('marks only notes in the selected scale as playable degrees', () => {
    const keys = new PianoLayout().keys(new Scale('C', ScaleType.NATURAL_MINOR));

    expect(keys.map((key) => key.degree)).toEqual([
      1, null, 2, 3, null, 4, null, 5, 6, null, 7, null, 8,
    ]);
  });

  it('returns regions only for the eight playable scale degrees', () => {
    const regions = new PianoLayout().regions(new Scale('C#', ScaleType.MAJOR));

    expect(regions.map((region) => region.degree)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  it('hit-tests scale keys to their degrees and ignores keys outside the scale', () => {
    const layout = new PianoLayout();
    const scale = new Scale('C', ScaleType.NATURAL_MINOR);
    layout.regions(scale);

    for (const key of layout.keys(scale)) {
      expect(
        layout.hitTest({
          x: key.x + key.width / 2,
          y: key.y + key.height / 2,
        }),
      ).toBe(key.degree);
    }
  });

  it('keeps every key inside the play area', () => {
    for (const root of ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const) {
      const keys = new PianoLayout().keys(new Scale(root, ScaleType.MAJOR));

      for (const key of keys) {
        expect(key.x).toBeGreaterThanOrEqual(0);
        expect(key.y).toBeGreaterThanOrEqual(0);
        expect(key.x + key.width).toBeLessThanOrEqual(1);
        expect(key.y + key.height).toBeLessThanOrEqual(1);
      }
    }
  });
});
