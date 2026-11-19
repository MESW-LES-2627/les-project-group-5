/** Where the settings are kept between visits. */
export interface SettingsStorage {
  load(): string | null;
  save(value: string): void;
}