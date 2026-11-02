import type { Handedness } from '@instrument/domain';

const DEFAULT_HAND: Handedness = 'Right';
const default_camera_preview = true;

type HandListener = (hand: Handedness) => void;
type CameraPreviewListener = (visible: boolean) => void;

/** Holds the player's settings. Pages report changes to it; the loop and the instrument page listen to it. */
export class SettingsStore {
  private current: Handedness = DEFAULT_HAND;
  private currentCameraPreview = default_camera_preview;
  private readonly listeners = new Set<HandListener>();
  private readonly cameraPreviewListeners = new Set<CameraPreviewListener>();

  /** The hand that plays the instrument. */
  get hand(): Handedness {
    return this.current;
  }

  get cameraPreview(): boolean {
    return this.currentCameraPreview;
  }

  /** Changes the hand and tells every listener. Does nothing if the hand is the same. */
  setHand(hand: Handedness): void {
    if (hand === this.current) return;
    this.current = hand;
    for (const listener of [...this.listeners]) listener(hand);
  }

  setCameraPreview(visible: boolean): void {
    if (visible === this.currentCameraPreview) return;
    this.currentCameraPreview = visible;
    for (const listener of [...this.cameraPreviewListeners]) listener(visible);
  }

  /** Returns a function that removes the listener. */
  subscribe(listener: HandListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Returns a function that removes the listener. */
  subscribeCameraPreview(listener: CameraPreviewListener): () => void {
    this.cameraPreviewListeners.add(listener);
    return () => this.cameraPreviewListeners.delete(listener);
  }
}
