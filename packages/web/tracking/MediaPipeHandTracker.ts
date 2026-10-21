import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { Landmark, TrackedHand } from '@instrument/domain';
import { toPlayerHandedness } from './handedness';
import type { HandTracker } from './HandTracker';

// Files served by Vite from packages/web/public/ (see README: the WASM folder is copied on npm install).
const WASM_PATH = `${import.meta.env.BASE_URL}mediapipe/wasm`;
const MODEL_PATH = `${import.meta.env.BASE_URL}models/hand_landmarker.task`;

/**
 * HandTracker implemented with MediaPipe's HandLandmarker.
 * The only file in the project allowed to import MediaPipe (enforced by ESLint).
 *
 * It translates MediaPipe's result into the project's own TrackedHand type, so nothing else depends on MediaPipe.
 */
export class MediaPipeHandTracker implements HandTracker {
  private landmarker: HandLandmarker | null = null;
  private loading: Promise<void> | null = null;
  private lastTimestampMs = -1;

  /** Safe to call several times: the model is loaded once. If loading fails, the next call tries again. */
  init(): Promise<void> {
    if (!this.loading) {
      this.loading = this.load().catch((error: unknown) => {
        this.loading = null;
        throw error;
      });
    }
    return this.loading;
  }

  private async load(): Promise<void> {
    const fileset = await FilesetResolver.forVisionTasks(WASM_PATH);
    try {
      this.landmarker = await this.create(fileset, 'GPU');
    } catch {
      // Some machines or browsers can't use the GPU delegate. The CPU is slower but works everywhere.
      this.landmarker = await this.create(fileset, 'CPU');
    }
  }

  detect(video: HTMLVideoElement, timestampMs: number): TrackedHand[] {
    if (!this.landmarker) {
      throw new Error('MediaPipeHandTracker.detect() called before init()');
    }
    // In video mode, MediaPipe requires strictly increasing timestamps.
    const timestamp = Math.max(timestampMs, this.lastTimestampMs + 1);
    this.lastTimestampMs = timestamp;
    return toTrackedHands(this.landmarker.detectForVideo(video, timestamp));
  }

  private create(fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>, delegate: 'GPU' | 'CPU') {
    return HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_PATH, delegate },
      runningMode: 'VIDEO',
      // Two hands, so that the dominant one can be picked even when both are in view.
      numHands: 2,
    });
  }
}

function toTrackedHands(result: HandLandmarkerResult): TrackedHand[] {
  const hands: TrackedHand[] = [];
  result.landmarks.forEach((landmarks, i) => {
    const handedness = toPlayerHandedness(result.handedness[i]?.[0]?.categoryName);
    if (handedness) {
      hands.push({
        handedness,
        landmarks: landmarks.map(toLandmark),
        worldLandmarks: (result.worldLandmarks[i] ?? []).map(toLandmark),
      });
    }
  });
  return hands;
}

function toLandmark(point: { x: number; y: number; z: number }): Landmark {
  return { x: point.x, y: point.y, z: point.z };
}
