import { describe, expect, it } from 'vitest';
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

    expect(result).toEqual([
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

  it('rejects empty data and duplicate exercise ids', () => {
    expect(() => parseExerciseConfigurations([])).toThrow('must contain at least one exercise');

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
