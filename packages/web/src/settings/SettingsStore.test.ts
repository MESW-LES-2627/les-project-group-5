import { describe, expect, it, vi } from "vitest";
import { SettingsStore } from "./SettingsStore";
import { ScaleType } from "@instrument/domain";
import type { SettingsStorage } from "./SettingsStorage";

class MemoryStorage implements SettingsStorage {
  value: string | null = null;
  load() {
    return this.value;
  }
  save(value: string) {
    this.value = value;
  }
}

/** A storage that already contains the given saved settings. */
const storageWith = (saved: unknown): MemoryStorage => {
  const storage = new MemoryStorage();
  storage.value = typeof saved === "string" ? saved : JSON.stringify(saved);
  return storage;
};

describe("SettingsStore", () => {
  it("starts with the right hand", () => {
    expect(new SettingsStore(new MemoryStorage()).hand).toBe("Right");
  });

  it("updates the hand and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    store.setHand("Left");
    expect(store.hand).toBe("Left");
    expect(listener).toHaveBeenCalledWith("Left");
  });

  it("does not notify when the hand does not change", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribe(listener);
    store.setHand("Right");
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    unsubscribe();
    store.setHand("Left");
    expect(listener).not.toHaveBeenCalled();
  });

  it("shows the camera preview by default", () => {
    expect(new SettingsStore(new MemoryStorage()).cameraPreview).toBe(true);
  });

  it("updates the preview setting and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeCameraPreview(listener);
    store.setCameraPreview(false);
    expect(store.cameraPreview).toBe(false);
    expect(listener).toHaveBeenCalledWith(false);
  });

  it("does not notify when the preview setting does not change", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeCameraPreview(listener);
    store.setCameraPreview(true);
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying the preview listener after unsubscribe", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribeCameraPreview(listener);
    unsubscribe();
    store.setCameraPreview(false);
    expect(listener).not.toHaveBeenCalled();
  });

  it("starts with the default pitch and scale", () => {
    const store = new SettingsStore(new MemoryStorage());
    expect(store.pitch).toBe("C");
    expect(store.scale).toBe(ScaleType.MAJOR);
  });

  it("updates the pitch and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribePitch(listener);
    store.setPitch("D");
    expect(store.pitch).toBe("D");
    expect(listener).toHaveBeenCalledWith("D");
  });

  it("updates the scale and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeScale(listener);
    store.setScale(ScaleType.NATURAL_MINOR);
    expect(store.scale).toBe(ScaleType.NATURAL_MINOR);
    expect(listener).toHaveBeenCalledWith(ScaleType.NATURAL_MINOR);
  });

  it("starts with the default layout", () => {
    expect(new SettingsStore(new MemoryStorage()).layout).toBe("pad-grid");
  });

  it("updates the layout and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeLayout(listener);
    store.setLayout("piano");
    expect(store.layout).toBe("piano");
    expect(listener).toHaveBeenCalledWith("piano");
  });

  it("does not notify when the layout does not change", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeLayout(listener);
    store.setLayout("pad-grid");
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribeLayout(listener);
    unsubscribe();
    store.setLayout("piano");
    expect(listener).not.toHaveBeenCalled();
  });

  it("starts at 0.5", () => {
    expect(new SettingsStore(new MemoryStorage()).sensitivity).toBe(0.5);
  });

  it("clamps to 0..1 and ignores NaN", () => {
    const store = new SettingsStore(new MemoryStorage());
    store.setSensitivity(3);
    expect(store.sensitivity).toBe(1);
    store.setSensitivity(-2);
    expect(store.sensitivity).toBe(0);
    store.setSensitivity(NaN);
    expect(store.sensitivity).toBe(0);
  });

  it("updates the sensitivity and notifies subscribers", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeSensitivity(listener);
    store.setSensitivity(0.8);
    expect(store.sensitivity).toBe(0.8);
    expect(listener).toHaveBeenCalledWith(0.8);
  });

  it("does not notify when the sensitivity does not change", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    store.subscribeSensitivity(listener);
    store.setSensitivity(0.5);
    expect(listener).not.toHaveBeenCalled();
  });

  it("stops notifying after unsubscribe", () => {
    const store = new SettingsStore(new MemoryStorage());
    const listener = vi.fn();
    const unsubscribe = store.subscribeSensitivity(listener);
    unsubscribe();
    store.setSensitivity(0.7);
    expect(listener).not.toHaveBeenCalled();
  });
});
describe("SettingsStore.reset", () => {
  it("goes back to the defaults and tells the listeners", () => {
    const store = new SettingsStore(new MemoryStorage());
    store.setHand("Left");
    store.setCameraPreview(false);
    store.setPitch("D");
    store.setScale(ScaleType.NATURAL_MINOR);
    store.setLayout("piano");
    store.setSensitivity(0.8);
    const handListener = vi.fn();
    store.subscribe(handListener);

    store.reset();

    expect(store.hand).toBe("Right");
    expect(store.cameraPreview).toBe(true);
    expect(store.pitch).toBe("C");
    expect(store.scale).toBe(ScaleType.MAJOR);
    expect(store.layout).toBe("pad-grid");
    expect(store.sensitivity).toBe(0.5);
    expect(handListener).toHaveBeenCalledWith("Right");
  });
});

describe("SettingsStore saving and restoring", () => {
  it("saves the settings when one changes", () => {
    const storage = new MemoryStorage();
    const store = new SettingsStore(storage);
    store.setHand("Left");
    store.setPitch("D");
    store.setScale(ScaleType.NATURAL_MINOR);
    store.setLayout("piano");
    store.setCameraPreview(false);
    store.setSensitivity(0.8);

    expect(JSON.parse(storage.value as string)).toEqual({
      hand: "Left",
      cameraPreview: false,
      pitch: "D",
      scale: ScaleType.NATURAL_MINOR.name,
      layout: "piano",
      sensitivity: 0.8,
    });
  });

  it("restores the saved settings", () => {
    const store = new SettingsStore(
      storageWith({
        hand: "Left",
        cameraPreview: false,
        pitch: "D",
        scale: ScaleType.NATURAL_MINOR.name,
        layout: "piano",
        sensitivity: 0.8,
      }),
    );

    expect(store.hand).toBe("Left");
    expect(store.cameraPreview).toBe(false);
    expect(store.pitch).toBe("D");
    expect(store.scale).toBe(ScaleType.NATURAL_MINOR);
    expect(store.layout).toBe("piano");
    expect(store.sensitivity).toBe(0.8);
  });

  it("does not write to the storage while restoring", () => {
    const storage = storageWith({ pitch: "D" });
    const save = vi.spyOn(storage, "save");
    new SettingsStore(storage);
    expect(save).not.toHaveBeenCalled();
  });

  it("uses the defaults when the saved text is not valid JSON", () => {
    const store = new SettingsStore(storageWith("{ broken"));
    expect(store.hand).toBe("Right");
    expect(store.pitch).toBe("C");
  });

  it("uses the default pitch when the saved pitch is invalid", () => {
    expect(new SettingsStore(storageWith({ pitch: "H" })).pitch).toBe("C");
  });

  it("uses the default scale when the saved scale name is unknown", () => {
    expect(new SettingsStore(storageWith({ scale: "Unknown" })).scale).toBe(
      ScaleType.MAJOR,
    );
  });

  it("uses the default layout when the saved layout is invalid", () => {
    expect(new SettingsStore(storageWith({ layout: "invalid" })).layout).toBe(
      "pad-grid",
    );
  });

  it("ignores an invalid hand and an invalid camera preview", () => {
    const store = new SettingsStore(
      storageWith({ hand: "Middle", cameraPreview: "yes" }),
    );
    expect(store.hand).toBe("Right");
    expect(store.cameraPreview).toBe(true);
  });

  it("clamps a saved sensitivity and ignores a value that is not a number", () => {
    expect(new SettingsStore(storageWith({ sensitivity: 5 })).sensitivity).toBe(
      1,
    );
    expect(
      new SettingsStore(storageWith({ sensitivity: "high" })).sensitivity,
    ).toBe(0.5);
  });

  it("saves the defaults after reset", () => {
    const storage = new MemoryStorage();
    const store = new SettingsStore(storage);
    store.setHand("Left");
    store.reset();
    expect(JSON.parse(storage.value as string).hand).toBe("Right");
  });
});
