import { describe, expect, it } from 'vitest';
import { cameraToView } from './cameraToView';

describe('cameraToView', () => {
  const camera = { width: 640, height: 480 };

  it('changes nothing when the view has the camera shape', () => {
    const p = cameraToView({ x: 0.2, y: 0.7 }, camera, { width: 400, height: 300 });
    expect(p.x).toBeCloseTo(0.2);
    expect(p.y).toBeCloseTo(0.7);
  });

  it('maps the visible slice to 0..1 when the view is narrower (phone)', () => {
    const view = { width: 300, height: 600 };
    expect(cameraToView({ x: 0.3125, y: 0.5 }, camera, view).x).toBeCloseTo(0);
    expect(cameraToView({ x: 0.6875, y: 0.5 }, camera, view).x).toBeCloseTo(1);
    expect(cameraToView({ x: 0.5, y: 0.5 }, camera, view).x).toBeCloseTo(0.5);
  });
});
