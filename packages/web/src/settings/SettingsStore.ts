import type { Handedness } from '@instrument/domain';

const DEFAULT_HAND: Handedness = 'Right';
const DEFAULT_CAMERA_PREVIEW = true;

type HandListener = (hand: Handedness) => void;
type CameraPreviewListener = (visible: boolean) => void;

/** Holds the player's settings. Pages report changes to it; the loop and the instrument page listen to it. */
export class SettingsStore {
  private current: Handedness = DEFAULT_HAND;
  private current_camera_preview = DEFAULT_CAMERA_PREVIEW;
  private readonly listeners = new Set<HandListener>();
  private readonly camera_preview_listeners = new Set<CameraPreviewListener>();

  get hand(): Handedness {
    return this.current;
  }

  get cameraPreview(): boolean {
    return this.current_camera_preview;
  }

  setHand(hand: Handedness): void {
    if (hand === this.current) return;
    this.current = hand;
    for (const listener of [...this.listeners]) listener(hand);
  }

  setCameraPreview(visible: boolean): void {
    if (visible === this.current_camera_preview) return;
    this.current_camera_preview = visible;
    for (const listener of [...this.camera_preview_listeners]) listener(visible);
  }

  /** Returns a function that removes the listener. */
  subscribe(listener: HandListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Returns a function that removes the listener. */
  subscribeCameraPreview(listener: CameraPreviewListener): () => void {
    this.camera_preview_listeners.add(listener);
    return () => this.camera_preview_listeners.delete(listener);
  }
}
