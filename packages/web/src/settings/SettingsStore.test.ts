import { describe, expect, it, vi } from 'vitest';
import { SettingsStore} from './SettingsStore';
import { ScaleType } from '@instrument/domain';

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

});