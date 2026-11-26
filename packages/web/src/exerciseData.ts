import { PITCH_CLASSES, ScaleType, type PitchClass } from '@instrument/domain';

/** Configuration used to display one challenge; adding another entry does not require game-engine changes. */
export interface GameExercise {
  /** Unique id within the exercise data file. */
  readonly id: number;
  /** Difficulty level shown on the Game page. */
  readonly level: number;
  /** Human-readable exercise name. */
  readonly title: string;
  /** Starting note for the scale, such as C. */
  readonly key: PitchClass;
  /** Note pattern built from the starting note, such as major or natural minor. */
  readonly scale: string;
  /** Notes the player will reproduce, in order. */
  readonly sequence: readonly PitchClass[];
}

export async function loadExerciseConfigurations(): Promise<readonly GameExercise[]> {
  const path = `${import.meta.env.BASE_URL}exercises.json`;
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Could not load ${path}: HTTP ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  return parseExerciseConfigurations(data);
}

export function parseExerciseConfigurations(data: unknown): readonly GameExercise[] {
  if (!Array.isArray(data)) {
    throw new Error('Exercise data must be a JSON array.');
  }
  if (data.length === 0) {
    throw new Error('Exercise data must contain at least one exercise.');
  }

  const ids = new Set<number>();
  return data.map((item: unknown, index: number) => parseExercise(item, index, ids));
}

function parseExercise(item: unknown, index: number, ids: Set<number>): GameExercise {
  const label = `Exercise ${index + 1}`;
  if (!isRecord(item)) throw new Error(`${label} must be an object.`);

  const id = positiveInteger(item.id, `${label} id`);
  if (ids.has(id)) throw new Error(`${label} has a duplicate id (${id}).`);
  const level = positiveInteger(item.level, `${label} level`);
  const title = nonEmptyString(item.title, `${label} title`);
  const key = pitchClass(item.key, `${label} key`);
  const scale = scaleId(item.scale, label);
  const sequence = pitchClassList(item.sequence, label);

  ids.add(id);
  return { id, level, title, key, scale, sequence };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function positiveInteger(value: unknown, name: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
  return value;
}

function nonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
  return value;
}

function pitchClass(value: unknown, name: string): PitchClass {
  if (!isPitchClass(value)) throw new Error(`${name} is unknown.`);
  return value;
}

function scaleId(value: unknown, label: string): string {
  if (typeof value !== 'string' || !ScaleType.fromId(value)) {
    throw new Error(`${label} has an unknown scale.`);
  }
  return value;
}

function pitchClassList(value: unknown, label: string): PitchClass[] {
  if (!isPitchClassList(value) || value.length === 0) {
    throw new Error(`${label} must have at least one valid note in its sequence.`);
  }
  return value;
}

function isPitchClass(value: unknown): value is PitchClass {
  return PITCH_CLASSES.some((pitch) => pitch === value);
}

function isPitchClassList(value: unknown): value is PitchClass[] {
  return Array.isArray(value) && value.every(isPitchClass);
}
