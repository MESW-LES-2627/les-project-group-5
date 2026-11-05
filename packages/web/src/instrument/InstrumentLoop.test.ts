import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_CALIBRATION_PROFILE, HandFeatureExtractor, Instrument, type InstrumentFrame, type Layout } from '@instrument/domain';
import { makeHand } from '@instrument/domain/testing';
import { FakeHandTracker } from '../tracking/FakeHandTracker';
import { InstrumentLoop } from './InstrumentLoop';

/** A fake layout: left half of the play area is degree 1, right half is degree 2. */
const twoCells: Layout = { regions: () => [], hitTest: (point) => (point.x < 0.5 ? 1 : 2) };

/** Just enough of a video element for the loop: a ready state and a current time we can move forward. */
function fakeVideo() {
  return { readyState: 4, currentTime: 0 } as { readyState: number; currentTime: number } & HTMLVideoElement;
}

const bothHands = () => [
  makeHand({ handedness: 'Right', indexTip: { x: 0.75, y: 0.5 }, reach: 2 }), // degree 1
  makeHand({ handedness: 'Left', indexTip: { x: 0.25, y: 0.5 }, reach: 2 }),  // degree 2
];

function setup() {
  const tracker = new FakeHandTracker();
  const video = fakeVideo();
  const loop = new InstrumentLoop(tracker, new HandFeatureExtractor(), DEFAULT_CALIBRATION_PROFILE, new Instrument(twoCells), video, 'Right');
  const frames: InstrumentFrame[] = [];
  loop.subscribe((frame) => frames.push(frame));
  return { tracker, video, loop, frames };
}

describe('InstrumentLoop', () => {
  it('runs the pipeline and sends the frame to listeners', () => {
    const { tracker, video, loop, frames } = setup();
    // Camera sees the fingertip on its right (x 0.75); mirrored, that's the player's left → degree 1.
    tracker.setHands([makeHand({ handedness: 'Right', indexTip: { x: 0.75, y: 0.5 }, reach: 2 })]);
    video.currentTime = 1;
    loop.tick(1000);
    expect(frames).toHaveLength(1);
    expect(frames[0]).toMatchObject({ handDetected: true, degree: 1, volume: 1, sounding: true });
    expect(frames[0].change).toEqual({ kind: 'start', degree: 1 });
  });

  it('skips the step when the camera has no new frame', () => {
    const { tracker, video, loop, frames } = setup();
    tracker.setHands([makeHand({})]);
    video.currentTime = 1;
    loop.tick(1000);
    loop.tick(1016);
    expect(frames).toHaveLength(1);
  });

  it('skips the step while the video is not ready', () => {
    const { video, loop, frames } = setup();
    video.readyState = 1;
    video.currentTime = 1;
    loop.tick(1000);
    expect(frames).toHaveLength(0);
  });

  it.each([
    ['Right', 'Left'],
    ['Left', 'Right'],
  ] as const)('reports no hand when %s is chosen and only %s is in view', (chosen, visible) => {
    const { tracker, video, loop, frames } = setup();
    loop.setDominantHand(chosen);
    tracker.setHands([makeHand({ handedness: visible, indexTip: { x: 0.75, y: 0.5 }, reach: 2 })]);
    video.currentTime = 1;
    loop.tick(1000);
    expect(frames[0]).toMatchObject({ handDetected: false, sounding: false, degree: null });
  });

  it('stops sending frames to a listener after it unsubscribes', () => {
    const { tracker, video, loop } = setup();
    const received: InstrumentFrame[] = [];
    const unsubscribe = loop.subscribe((frame) => received.push(frame));
    tracker.setHands([makeHand({})]);
    video.currentTime = 1;
    loop.tick(1000);
    unsubscribe();
    video.currentTime = 2;
    loop.tick(1033);
    expect(received).toHaveLength(1);
  });

  it('follows the hand chosen with setDominantHand and ignores the other', () => {
    const { tracker, video, loop, frames } = setup();
    tracker.setHands(bothHands());

    video.currentTime = 1;
    loop.tick(1000);
    expect(frames[0]).toMatchObject({ handDetected: true, degree: 1 });

    loop.setDominantHand('Left');
    video.currentTime = 2;
    loop.tick(1033);
    expect(frames[1]).toMatchObject({ handDetected: true, degree: 2 });
  });

  it('reports a frame-processing error and stops the animation loop', () => {
    const { tracker, video, loop } = setup();
    const onError = vi.fn();
    let nextFrame: FrameRequestCallback | undefined;
    const requestFrame = vi.fn((callback: FrameRequestCallback) => {
      nextFrame = callback;
      return 1;
    });
    vi.stubGlobal('requestAnimationFrame', requestFrame);
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    tracker.detect = () => {
      throw new Error('tracking failed');
    };
    video.currentTime = 1;
    loop.subscribeError(onError);

    try {
      loop.start();
      nextFrame?.(1000);
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0][0]).toMatchObject({ message: 'tracking failed' });
      expect(requestFrame).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });

});
