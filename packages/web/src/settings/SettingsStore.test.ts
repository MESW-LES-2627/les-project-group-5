import { describe, expect, it, vi } from 'vitest';
import { SettingsStore } from './SettingsStore';

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

});