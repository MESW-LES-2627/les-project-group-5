import { describe, expect, it } from 'vitest';
import { ScaleType } from '@instrument/domain';
import { parseExerciseConfigurations } from './exerciseData';

describe('parseExerciseConfigurations', () => {
  it('parses a list of exercise configurations', () => {
    const result = parseExerciseConfigurations([
      {
        id: 1,
        level: 1,
        title: 'Exercise 1',
        key: 'C',
        scale: 'major',
        sequence: ['C', 'D'],
      },
      {
        id: 2,
        level: 1,
        title: 'Exercise 2',
        key: 'D',
        scale: 'natural-minor',
        sequence: ['D', 'E'],
      },
    ]);

    // JSON uses readable scale ids; the parser turns them into domain scale types for the app.
    expect(result).toEqual([
      {
        id: 1,
        level: 1,
        title: 'Exercise 1',
        key: 'C',
        scale: ScaleType.MAJOR,
        sequence: ['C', 'D'],
      },
      {
        id: 2,
        level: 1,
        title: 'Exercise 2',
        key: 'D',
        scale: ScaleType.NATURAL_MINOR,
        sequence: ['D', 'E'],
      },
    ]);
  });

  it('rejects unknown notes and scales', () => {
    const invalidKey = [{
      id: 1,
      level: 1,
      title: 'Invalid exercise',
      key: 'H',
      scale: 'major',
      sequence: ['C'],
    }];
    const invalidScale = [{
      id: 1,
      level: 1,
      title: 'Invalid exercise',
      key: 'C',
      scale: 'blues',
      sequence: ['C'],
    }];

    expect(() => parseExerciseConfigurations(invalidKey)).toThrow('Exercise 1 key is unknown.');
    expect(() => parseExerciseConfigurations(invalidScale)).toThrow('Exercise 1 has an unknown scale.');
  });

  it('rejects notes that are not in the exercise scale', () => {
    const exerciseWithNoteOutsideScale = [{
      id: 1,
      level: 1,
      title: 'Invalid exercise',
      key: 'C',
      scale: 'major',
      sequence: ['F#'],
    }];

    expect(() => parseExerciseConfigurations(exerciseWithNoteOutsideScale))
      .toThrow('Exercise 1 has a sequence note that is not in its scale.');
  });

  it('allows sharp notes when the exercise scale includes them', () => {
    const result = parseExerciseConfigurations([
      {
        id: 1,
        level: 1,
        title: 'G major exercise',
        key: 'G',
        scale: 'major',
        sequence: ['F#'],
      },
    ]);

    expect(result[0]?.sequence).toEqual(['F#']);
  });

  it('allows an empty list and rejects duplicate exercise ids', () => {
    expect(parseExerciseConfigurations([])).toEqual([]);

    const exercise = {
      id: 1,
      level: 1,
      title: 'Exercise 1',
      key: 'C',
      scale: 'major',
      sequence: ['C'],
    };
    expect(() => parseExerciseConfigurations([exercise, exercise])).toThrow('duplicate id (1)');
  });
});
