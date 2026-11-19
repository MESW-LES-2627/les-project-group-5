import type { Point } from '../geometry/Point';

export interface Size {
  readonly width: number;
  readonly height: number;
}

/**
 * Converts a point in the camera image to a point in the box that shows the image with object-fit: cover.
 * Both points are from 0 to 1. A point in the cropped part of the image goes outside 0..1.
 */
export function cameraToView(point: Point, camera: Size, view: Size): Point {
  const cameraAspect = camera.width / camera.height;
  const viewAspect = view.width / view.height;
  // The part of the image that is visible: the whole image in one direction, a centred slice in the other.
  const visibleX = viewAspect < cameraAspect ? viewAspect / cameraAspect : 1;
  const visibleY = viewAspect > cameraAspect ? cameraAspect / viewAspect : 1;
  return {
    x: (point.x - (1 - visibleX) / 2) / visibleX,
    y: (point.y - (1 - visibleY) / 2) / visibleY,
  };
}