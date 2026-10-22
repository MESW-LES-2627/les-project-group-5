/** Why the camera could not be opened, so the page can show the right message (NFR-11). */
export type CameraProblem = 'denied' | 'not-found' | 'unsupported' | 'unknown';

export class CameraError extends Error {
  constructor(readonly problem: CameraProblem) {
    super(`Camera problem: ${problem}`);
  }
}

/** Opens the front camera and shows it in a video element. */
export class Camera {
  async open(video: HTMLVideoElement): Promise<void> {
    // getUserMedia only exists on secure pages (https or localhost).
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new CameraError('unsupported');
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch (error) {
      throw new CameraError(toProblem(error));
    }
    video.srcObject = stream;
    video.muted = true;
    video.playsInline = true;
    await video.play();
  }
}

function toProblem(error: unknown): CameraProblem {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'denied';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'not-found';
  return 'unknown';
}
