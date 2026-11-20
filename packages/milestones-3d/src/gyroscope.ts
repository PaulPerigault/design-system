// Inclinaison au gyroscope. Sur iOS, l'orientation de l'appareil demande une autorisation : elle ne
// se demande que sur un geste de l'utilisateur, jamais au chargement. Sans capteur ni autorisation,
// l'interaction se limite au pointeur (`onTilt(null)` rend la main au pointeur).
import type { Bag, ListenTarget } from './bag.ts';
import { GYRO_RANGE_DEG, GYRO_REST_BETA_DEG } from './constants.ts';

export type GyroState = 'unavailable' | 'needs-gesture' | 'active' | 'denied';
export interface Tilt {
  readonly x: number;
  readonly y: number;
}

export interface GyroEnv {
  /** Cible des événements `deviceorientation` (la fenêtre). */
  readonly target: ListenTarget;
  /** Le constructeur `DeviceOrientationEvent` ; absent : pas de capteur du tout. */
  readonly orientation?: object | undefined;
}

export interface Gyroscope {
  readonly state: GyroState;
  /** À appeler depuis un geste (toucher, clic) : demande l'autorisation là où elle existe. */
  requestFromGesture(): Promise<void>;
}

const clamp = (value: number): number => Math.max(-1, Math.min(1, value));
const isNumber = (value: unknown): value is number => typeof value === 'number';

/** Angles bruts (`beta` avant-arrière, `gamma` gauche-droite) vers [-1, 1] ; `null` sans mesure. */
export function toTilt(event: unknown): Tilt | null {
  if (typeof event !== 'object' || event === null) return null;
  const beta = 'beta' in event ? event.beta : null;
  const gamma = 'gamma' in event ? event.gamma : null;
  if (!isNumber(beta) || !isNumber(gamma)) return null;
  return {
    x: clamp(gamma / GYRO_RANGE_DEG),
    y: clamp((beta - GYRO_REST_BETA_DEG) / GYRO_RANGE_DEG),
  };
}

/** `requestPermission` de l'objet s'il existe (iOS) ; `null` ailleurs : aucune autorisation. */
function permissionRequest(orientation: object | undefined): (() => Promise<unknown>) | null {
  if (!orientation || !('requestPermission' in orientation)) return null;
  const request = orientation.requestPermission;
  return typeof request === 'function' ? () => Promise.resolve(request.call(orientation)) : null;
}

export function createGyroscope(env: GyroEnv, bag: Bag, onTilt: (tilt: Tilt | null) => void) {
  let state: GyroState = env.orientation === undefined ? 'unavailable' : 'needs-gesture';
  const attach = (): void => {
    state = 'active';
    bag.listen(env.target, 'deviceorientation', (event) => onTilt(toTilt(event)));
  };
  const ask = permissionRequest(env.orientation);
  if (env.orientation !== undefined && ask === null) attach();
  return {
    get state() {
      return state;
    },
    async requestFromGesture() {
      if (state !== 'needs-gesture' || ask === null) return;
      try {
        state = 'denied';
        if ((await ask()) === 'granted') attach();
      } catch {
        state = 'denied';
      }
    },
  } satisfies Gyroscope;
}
