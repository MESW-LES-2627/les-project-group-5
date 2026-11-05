import { ScaleType, type Handedness, type PitchClass } from '@instrument/domain';

const DEFAULT_HAND: Handedness = 'Right';
const default_camera_preview = true;
const DEFAULT_PITCH: PitchClass = 'C';
const DEFAULT_SCALE: ScaleType = ScaleType.MAJOR;

type HandListener = (hand: Handedness) => void;
type CameraPreviewListener = (visible: boolean) => void;

/** Holds the player's settings. Pages report changes to it; the loop and the instrument page listen to it. */
export class SettingsStore {
  private current: Handedness = DEFAULT_HAND;
  private currentCameraPreview = default_camera_preview;
  private currentPitch: PitchClass = DEFAULT_PITCH;
  private currentScale: ScaleType = DEFAULT_SCALE
  private readonly listeners = new Set<HandListener>();
  private readonly cameraPreviewListeners = new Set<CameraPreviewListener>();
  private readonly pitchListeners = new Set<(pitch: PitchClass) => void>();
  private readonly scaleListeners = new Set<(scale: ScaleType) => void>();

  /** The hand that plays the instrument. */
  get hand(): Handedness {
    return this.current;
  }

  get cameraPreview(): boolean {
    return this.currentCameraPreview;
  }

    /** The root note of the scale. */
  get pitch(): PitchClass {
    return this.currentPitch;
  }

  /** Major or natural minor. */
  get scale(): ScaleType {
    return this.currentScale;
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

  setPitch(pitch: PitchClass): void {
    if (pitch === this.currentPitch) return;
    this.currentPitch = pitch;
    for (const listener of [...this.pitchListeners]) listener(pitch);
  }
  
  setScale(scale: ScaleType): void {
    if (scale === this.currentScale) return;
    this.currentScale = scale;
    for (const listener of [...this.scaleListeners]) listener(scale);
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
  
  /** Returns a function that removes the listener. */
  subscribePitch(listener: (pitch: PitchClass) => void): () => void {
    this.pitchListeners.add(listener);
    return () => this.pitchListeners.delete(listener);
  }

  /** Returns a function that removes the listener. */
  subscribeScale(listener: (scale: ScaleType) => void): () => void {
    this.scaleListeners.add(listener);
    return () => this.scaleListeners.delete(listener);
  }

}
