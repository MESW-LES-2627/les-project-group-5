import { describe, expect, it, vi, beforeEach } from 'vitest';
import { SettingsStore } from './SettingsStore';
import { ScaleType } from '@instrument/domain';

beforeEach(() => {
  document.cookie = 'instrument-settings=; max-age=0; path=/';
});

describe('SettingsStore', () => {
  it('starts with the right hand', () => {
    expect(new SettingsStore().hand).toBe('Right');
  });

  it('updates the hand and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setHand('Left');
    expect(store.hand).toBe('Left');
    expect(listener).toHaveBeenCalledWith('Left');
  });

  it('does not notify when the hand does not change', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribe(listener);
    store.setHand('Right');
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setHand('Left');
    expect(listener).not.toHaveBeenCalled();
  });

  it('shows the camera preview by default', () => {
    expect(new SettingsStore().cameraPreview).toBe(true);
  });

  it('updates the preview setting and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeCameraPreview(listener);
    store.setCameraPreview(false);
    expect(store.cameraPreview).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);
  });

  it('does not notify when the preview setting does not change', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeCameraPreview(listener);
    store.setCameraPreview(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying the preview listener after unsubscribe', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeCameraPreview(listener);
    unsubscribe();
    store.setCameraPreview(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it('starts with the default pitch and scale', () => {
    const store = new SettingsStore();
    expect(store.pitch).toBe('C');
    expect(store.scale).toBe(ScaleType.MAJOR);
  });

  it('updates the pitch and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribePitch(listener);
    store.setPitch('D');
    expect(store.pitch).toBe('D');
    expect(listener).toHaveBeenCalledWith('D');
  });

  it('updates the scale and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeScale(listener);
    store.setScale(ScaleType.NATURAL_MINOR);
    expect(store.scale).toBe(ScaleType.NATURAL_MINOR);
    expect(listener).toHaveBeenCalledWith(ScaleType.NATURAL_MINOR);
  });

  it('starts with the default layout', () => {
    expect(new SettingsStore().layout).toBe('pad-grid');
  });

  it('updates the layout and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeLayout(listener);
    store.setLayout('piano');
    expect(store.layout).toBe('piano');
    expect(listener).toHaveBeenCalledWith('piano');
  });

  it('does not notify when the layout does not change', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeLayout(listener);
    store.setLayout('pad-grid');
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeLayout(listener);
    unsubscribe();
    store.setLayout('piano');
    expect(listener).not.toHaveBeenCalled();
  });

  it('starts at 0.5', () => {
    expect(new SettingsStore().sensitivity).toBe(0.5);
  });

  it('clamps to 0..1 and ignores NaN', () => {
    const store = new SettingsStore();
    store.setSensitivity(3);
    expect(store.sensitivity).toBe(1);
    store.setSensitivity(-2);
    expect(store.sensitivity).toBe(0);
    store.setSensitivity(NaN);
    expect(store.sensitivity).toBe(0);
  });

  it('updates the sensitivity and notifies subscribers', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeSensitivity(listener);
    store.setSensitivity(0.8);
    expect(store.sensitivity).toBe(0.8);
    expect(listener).toHaveBeenCalledWith(0.8);
  });

  it('does not notify when the sensitivity does not change', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    store.subscribeSensitivity(listener);
    store.setSensitivity(0.5);
    expect(listener).not.toHaveBeenCalled();
  });

  it('stops notifying after unsubscribe', () => {
    const store = new SettingsStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribeSensitivity(listener);
    unsubscribe();
    store.setSensitivity(0.7);
    expect(listener).not.toHaveBeenCalled();
  });

  it('restores saved settings from the cookie', () => {
    const store = new SettingsStore();

    store.setHand('Left');
    store.setCameraPreview(false);
    store.setPitch('D');
    store.setScale(ScaleType.NATURAL_MINOR);
    store.setLayout('piano');

    const restored = new SettingsStore();

    expect(restored.hand).toBe('Left');
    expect(restored.cameraPreview).toBe(false);
    expect(restored.pitch).toBe('D');
    expect(restored.scale).toBe(ScaleType.NATURAL_MINOR);
    expect(restored.layout).toBe('piano');
  });

  it('saves the settings cookie', () => {
    const store = new SettingsStore();
    store.setLayout('piano');

    expect(document.cookie).toContain('instrument-settings=');
  });
});

describe('SettingsStore.reset', () => {
  it('goes back to the defaults and tells the listeners', () => {
    const store = new SettingsStore();
    store.setHand('Left');
    store.setCameraPreview(false);
    store.setPitch('D');
    store.setScale(ScaleType.NATURAL_MINOR);
    store.setLayout('piano');
    store.setSensitivity(0.8);
    const handListener = vi.fn();
    store.subscribe(handListener);

    store.reset();

    expect(store.hand).toBe('Right');
    expect(store.cameraPreview).toBe(true);
    expect(store.pitch).toBe('C');
    expect(store.scale).toBe(ScaleType.MAJOR);
    expect(store.layout).toBe('pad-grid');
    expect(store.sensitivity).toBe(0.5);
    expect(handListener).toHaveBeenCalledWith('Right');
  });
});
