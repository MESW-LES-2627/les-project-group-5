import { DEFAULT_SENSITIVITY,  PITCH_CLASSES, ScaleType, type Handedness, type PitchClass, type LayoutKind } from '@instrument/domain';
import type { SettingsStorage } from './SettingsStorage';
import { CookieSettingsStorage } from './CookieSettingsStorage';

const DEFAULT_HAND: Handedness = 'Right';
const DEFAULT_CAMERA_PREVIEW = true;
const DEFAULT_PITCH: PitchClass = 'C';
const DEFAULT_SCALE: ScaleType = ScaleType.MAJOR;
const DEFAULT_LAYOUT: LayoutKind = 'pad-grid';

type HandListener = (hand: Handedness) => void;
type CameraPreviewListener = (visible: boolean) => void;

const isPitchClass = (value: unknown): value is PitchClass =>
typeof value === 'string' && (PITCH_CLASSES as readonly string[]).includes(value);

/** Every layout kind. The Record type makes TypeScript fail if a new LayoutKind is added and missing here. */
const LAYOUT_KIND_LOOKUP: Record<LayoutKind, true> = {
  'pad-grid': true,
  piano: true,
};

const isLayoutKind = (value: unknown): value is LayoutKind =>
  typeof value === 'string' && Object.keys(LAYOUT_KIND_LOOKUP).includes(value);
/** Holds the player's settings. Pages report changes to it; the loop and the instrument page listen to it. */
export class SettingsStore {
  private current: Handedness = DEFAULT_HAND;
  private currentCameraPreview = DEFAULT_CAMERA_PREVIEW;
  private currentPitch: PitchClass = DEFAULT_PITCH;
  private currentScale: ScaleType = DEFAULT_SCALE;
  private currentLayout: LayoutKind = DEFAULT_LAYOUT;
  private currentSensitivity = DEFAULT_SENSITIVITY;
  private readonly listeners = new Set<HandListener>();
  private readonly cameraPreviewListeners = new Set<CameraPreviewListener>();
  private readonly pitchListeners = new Set<(pitch: PitchClass) => void>();
  private readonly scaleListeners = new Set<(scale: ScaleType) => void>();
  private readonly layoutListeners = new Set<(layout: LayoutKind) => void>();
  private readonly sensitivityListeners = new Set<(sensitivity: number) => void>();

  constructor(private readonly storage: SettingsStorage = new CookieSettingsStorage()) {
  this.restore();
  }

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

  /** The layout of the instrument page. */
  get layout(): LayoutKind {
    return this.currentLayout;
  }

  get sensitivity(): number {
    return this.currentSensitivity;
  }

  /** Changes the hand and tells every listener. Does nothing if the hand is the same. */
  setHand(hand: Handedness): void {
    if (hand === this.current) return;
    this.current = hand;
    this.persist();
    for (const listener of [...this.listeners]) listener(hand);
  }

  setCameraPreview(visible: boolean): void {
    if (visible === this.currentCameraPreview) return;
    this.currentCameraPreview = visible;
     this.persist();
    for (const listener of [...this.cameraPreviewListeners]) listener(visible);
  }

  setPitch(pitch: PitchClass): void {
    if (pitch === this.currentPitch) return;
    this.currentPitch = pitch;
     this.persist();
    for (const listener of [...this.pitchListeners]) listener(pitch);
  }
  
  setScale(scale: ScaleType): void {
    if (scale === this.currentScale) return;
    this.currentScale = scale;
     this.persist();
    for (const listener of [...this.scaleListeners]) listener(scale);
  }

  setLayout(layout: LayoutKind): void {
    if (layout === this.currentLayout) return;
    this.currentLayout = layout; 
    this.persist();
    for (const listener of [...this.layoutListeners]) listener(layout);
  }

  setSensitivity(sensitivity: number): void {
    if (!Number.isFinite(sensitivity)) return;
    const value = Math.min(1, Math.max(0, sensitivity));
    if (value === this.currentSensitivity) return;
    this.currentSensitivity = value;
     this.persist();
    for (const listener of [...this.sensitivityListeners]) listener(value);
  }

  /**
   * Goes back to the default settings, telling every listener that changes (used when logging out, US-E1-05).
   * It reuses the setters, so the pages and the instrument update exactly as after a change by the player.
   */
  reset(): void {
    this.setHand(DEFAULT_HAND);
    this.setCameraPreview(DEFAULT_CAMERA_PREVIEW);
    this.setPitch(DEFAULT_PITCH);
    this.setScale(DEFAULT_SCALE);
    this.setLayout(DEFAULT_LAYOUT);
    this.setSensitivity(DEFAULT_SENSITIVITY);
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

  /** Returns a function that removes the listener. */
  subscribeLayout(listener: (layout: LayoutKind) => void): () => void {
    this.layoutListeners.add(listener);
    return () => this.layoutListeners.delete(listener);
  }

  /** Returns a function that removes the listener. */
  subscribeSensitivity(listener: (sensitivity: number) => void): () => void {
    this.sensitivityListeners.add(listener);
    return () => this.sensitivityListeners.delete(listener);
  }

  private restore(): void {
  const raw = this.storage.load();
  if (!raw) return;
  let saved: Record<string, unknown>;
  try {
    saved = JSON.parse(raw);
  } catch {
    return;
  }
    if (saved.hand === 'Left' || saved.hand === 'Right') this.current = saved.hand;
    if (typeof saved.cameraPreview === 'boolean') this.currentCameraPreview = saved.cameraPreview;
    this.currentPitch = isPitchClass(saved.pitch) ? saved.pitch : DEFAULT_PITCH;
    this.currentScale = ScaleType.fromName(saved.scale) ?? DEFAULT_SCALE;
    this.currentLayout = isLayoutKind(saved.layout) ? saved.layout : DEFAULT_LAYOUT;
    if (typeof saved.sensitivity === 'number' && Number.isFinite(saved.sensitivity)) {
      this.currentSensitivity = Math.min(1, Math.max(0, saved.sensitivity));
    }
  }

private persist(): void {
  this.storage.save(JSON.stringify({
    hand: this.current,
    cameraPreview: this.currentCameraPreview,
    pitch: this.currentPitch,
    scale: this.currentScale.name,
    layout: this.currentLayout,
    sensitivity: this.currentSensitivity,
  }));
}
}


