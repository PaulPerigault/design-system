import { describe, expect, it } from 'vitest';
import { GYRO_RANGE_DEG, GYRO_REST_BETA_DEG } from '../src/constants.ts';
import { toTilt } from '../src/gyroscope.ts';

describe('toTilt', () => {
  it('normalise de -1 à 1 autour de l’angle de tenue', () => {
    expect(toTilt({ beta: GYRO_REST_BETA_DEG, gamma: 0 })).toEqual({ x: 0, y: 0 });
    expect(toTilt({ beta: 0, gamma: -GYRO_RANGE_DEG })).toMatchObject({ x: -1 });
    expect(toTilt({ beta: 1000, gamma: 1000 })).toEqual({ x: 1, y: 1 });
    expect(toTilt({ beta: -1000, gamma: -1000 })).toEqual({ x: -1, y: -1 });
  });

  it('refuse ce qui n’est pas une mesure', () => {
    for (const event of [
      null,
      undefined,
      3,
      {},
      { beta: 1 },
      { gamma: 1 },
      { beta: '1', gamma: '2' },
    ]) {
      expect(toTilt(event), String(event)).toBeNull();
    }
  });
});
