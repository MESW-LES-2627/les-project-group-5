import { describe, expect, it } from 'vitest';
import { PointerSmoother } from './PointerSmoother';

describe('PointerSmoother', () => {
  it('passes the first point through and after reset()', () => {
    const s = new PointerSmoother();
    expect(s.apply({ x: 0.4, y: 0.4 })).toEqual({ x: 0.4, y: 0.4 });
    s.reset();
    expect(s.apply({ x: 0.9, y: 0.1 })).toEqual({ x: 0.9, y: 0.1 });
  });

  it('ignores jitter smaller than the dead zone', () => {
    const s = new PointerSmoother();
    s.setSensitivity(0);
    s.apply({ x: 0.5, y: 0.5 });
    expect(s.apply({ x: 0.505, y: 0.5 })).toEqual({ x: 0.5, y: 0.5 });
  });

  it('reaches the hand when it stops, instead of freezing short of it', () => {
    const s = new PointerSmoother();
    s.setSensitivity(0);
    s.apply({ x: 0.2, y: 0.5 });
    let out = s.apply({ x: 0.7, y: 0.5 });
    for (let i = 0; i < 60; i++) out = s.apply({ x: 0.7, y: 0.5 });
    expect(out.x).toBeCloseTo(0.7, 3);
  });

  it('moves less per frame at Low than at High', () => {
    const step = (sensitivity: number) => {
      const s = new PointerSmoother();
      s.setSensitivity(sensitivity);
      s.apply({ x: 0.2, y: 0.5 });
      return s.apply({ x: 0.7, y: 0.5 }).x - 0.2;
    };
    expect(step(0)).toBeLessThan(step(1));
  });
});