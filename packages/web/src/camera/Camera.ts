/** Why the camera could not be opened, so the page can show the right message (NFR-11). */
export type CameraProblem = 'denied' | 'not-found' | 'unsupported' | 'unknown';

/** Thrown by Camera.open when the camera can't be used. */
export class CameraError extends Error {
  constructor(
    /** What went wrong, so the page can pick the message to show. */
    readonly problem: CameraProblem,
  ) {
    super(`Camera problem: ${problem}`);
  }
}

/** Opens the front camera and shows it in a video element. */
export class Camera {
  /** Asks for the front camera and starts playing it in the video element. Throws a CameraError on failure. */
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
