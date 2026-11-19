import { describe, expect, it, vi } from 'vitest';
import { createBag } from '../src/bag.ts';
import { GYRO_RANGE_DEG, GYRO_REST_BETA_DEG } from '../src/constants.ts';
import { createGyroscope } from '../src/gyroscope.ts';
import type { Tilt } from '../src/gyroscope.ts';
import { FakeTarget } from './support.ts';

function setup(orientation: object | undefined) {
  const target = new FakeTarget();
  const bag = createBag();
  const tilts: (Tilt | null)[] = [];
  const gyro = createGyroscope({ target, orientation }, bag, (tilt) => tilts.push(tilt));
  return { target, bag, tilts, gyro };
}

const ios = (answer: () => Promise<string>) => ({ requestPermission: vi.fn(answer) });

describe('sans autorisation (Android, ordinateur)', () => {
  it('écoute tout de suite et incline avec l’appareil', () => {
    const { target, tilts, gyro } = setup({});
    expect(gyro.state).toBe('active');
    target.emit('deviceorientation', {
      beta: GYRO_REST_BETA_DEG + GYRO_RANGE_DEG,
      gamma: GYRO_RANGE_DEG,
    });
    expect(tilts).toEqual([{ x: 1, y: 1 }]);
  });

  it('un événement sans mesure (ordinateur de bureau) rend la main au pointeur', () => {
    const { target, tilts } = setup({});
    target.emit('deviceorientation', { beta: null, gamma: null });
    expect(tilts).toEqual([null]);
  });
});

describe('sans capteur', () => {
  it('rien n’est écouté, l’interaction se limite au pointeur', async () => {
    const { target, gyro, bag } = setup(undefined);
    expect(gyro.state).toBe('unavailable');
    await gyro.requestFromGesture();
    expect(target.live).toBe(0);
    expect(bag.size).toBe(0);
  });
});

describe('iOS : autorisation explicite', () => {
  it('ne demande rien au chargement et n’écoute pas', () => {
    const orientation = ios(async () => 'granted');
    const { target, gyro } = setup(orientation);
    expect(gyro.state).toBe('needs-gesture');
    expect(orientation.requestPermission).not.toHaveBeenCalled();
    expect(target.live).toBe(0);
  });

  it('demande sur geste, puis écoute si l’autorisation est accordée', async () => {
    const orientation = ios(async () => 'granted');
    const { target, gyro, tilts } = setup(orientation);
    await gyro.requestFromGesture();
    expect(orientation.requestPermission).toHaveBeenCalledOnce();
    expect(gyro.state).toBe('active');
    target.emit('deviceorientation', { beta: GYRO_REST_BETA_DEG, gamma: 0 });
    expect(tilts).toEqual([{ x: 0, y: 0 }]);
  });

  it('autorisation refusée : aucune écoute, état « denied », aucune nouvelle demande', async () => {
    const orientation = ios(async () => 'denied');
    const { target, gyro } = setup(orientation);
    await gyro.requestFromGesture();
    await gyro.requestFromGesture();
    expect(gyro.state).toBe('denied');
    expect(target.live).toBe(0);
    expect(orientation.requestPermission).toHaveBeenCalledOnce();
  });

  it('la demande échoue ou lève : « denied », sans exception', async () => {
    const rejected = setup(ios(() => Promise.reject(new Error('NotAllowedError'))));
    await expect(rejected.gyro.requestFromGesture()).resolves.toBeUndefined();
    expect(rejected.gyro.state).toBe('denied');
    const thrown = setup({
      requestPermission: () => {
        throw new Error('hors geste');
      },
    });
    await expect(thrown.gyro.requestFromGesture()).resolves.toBeUndefined();
    expect(thrown.gyro.state).toBe('denied');
  });

  it('deux gestes rapprochés ne produisent qu’une demande', async () => {
    const orientation = ios(async () => 'granted');
    const { gyro } = setup(orientation);
    await Promise.all([gyro.requestFromGesture(), gyro.requestFromGesture()]);
    expect(orientation.requestPermission).toHaveBeenCalledOnce();
  });

  it('l’écoute se retire avec le registre', async () => {
    const { target, gyro, bag } = setup(ios(async () => 'granted'));
    await gyro.requestFromGesture();
    expect(target.live).toBe(1);
    bag.disposeAll();
    expect(target.live).toBe(0);
  });
});
