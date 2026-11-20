import { describe, expect, it } from 'vitest';
import { cameraToView } from './cameraToView';

describe('cameraToView', () => {
  const camera = { width: 640, height: 480 };

  it('changes nothing when the view has the camera shape', () => {
    const p = cameraToView({ x: 0.2, y: 0.7 }, camera, { width: 400, height: 300 });
    expect(p.x).toBeCloseTo(0.2);
    expect(p.y).toBeCloseTo(0.7);
  });

  it('maps the visible slice when the view is wider than the camera', () => {
    const view = { width: 640, height: 360 };
    const top = cameraToView({ x: 0.25, y: 0.125 }, camera, view);
    const center = cameraToView({ x: 0.25, y: 0.5 }, camera, view);
    const bottom = cameraToView({ x: 0.25, y: 0.875 }, camera, view);

    expect(top.y).toBeCloseTo(0);
    expect(center.y).toBeCloseTo(0.5);
    expect(bottom.y).toBeCloseTo(1);
    expect(center.x).toBeCloseTo(0.25);
  });
});
