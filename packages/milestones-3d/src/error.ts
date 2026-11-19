import type { FallbackReason } from './types.ts';

/**
 * Chaque code d'erreur et la raison de repli qu'il entraîne. Les seize premiers viennent du `.wasm`
 * (`SceneError::code` et codes WebGL de crates/pp-milestones-wasm/src/fault.rs) ; les autres sont
 * ceux de l'enveloppe.
 */
const REASONS = {
  'milestone-count': 'invalid-data',
  'invalid-id': 'invalid-data',
  'duplicate-id': 'invalid-data',
  'unknown-status': 'invalid-data',
  'unknown-emblem': 'invalid-data',
  'length-mismatch': 'invalid-data',
  'theme-length': 'invalid-theme',
  'theme-value': 'invalid-theme',
  'theme-color': 'invalid-theme',
  'active-index': 'invalid-data',
  viewport: 'init-failed',
  'geometry-size': 'init-failed',
  'gl-unavailable': 'no-webgl2',
  'shader-compile': 'init-failed',
  'program-link': 'init-failed',
  'gl-resource': 'init-failed',
  'invalid-data': 'invalid-data',
  'invalid-label': 'invalid-data',
  'invalid-date': 'invalid-data',
  'invalid-href': 'invalid-data',
  'invalid-theme': 'invalid-theme',
  'unsupported-color': 'invalid-theme',
  'load-failed': 'load-failed',
  'not-ready': 'init-failed',
  internal: 'init-failed',
} as const satisfies Record<string, FallbackReason>;

export type ErrorCode = keyof typeof REASONS;

const isCode = (text: string): text is ErrorCode => Object.hasOwn(REASONS, text);

export class MilestonesError extends Error {
  readonly code: ErrorCode;
  /** Où se trouve le défaut (`milestones[2].date`, `--pp-color-accent`…), s'il se situe. */
  readonly detail: string | undefined;

  constructor(code: ErrorCode, detail?: string, options?: ErrorOptions) {
    super(detail ? `${code} : ${detail}` : code, options);
    this.name = 'MilestonesError';
    this.code = code;
    this.detail = detail;
  }
}

/** Rend une valeur levée par le `.wasm` (un code littéral) en `MilestonesError` ; sinon `internal`. */
export function parseFault(raised: unknown): MilestonesError {
  if (raised instanceof MilestonesError) return raised;
  if (typeof raised === 'string' && isCode(raised)) return new MilestonesError(raised);
  return new MilestonesError('internal', undefined, { cause: raised });
}

/** Raison de repli d'une erreur d'initialisation. */
export const reasonOf = (error: MilestonesError): FallbackReason => REASONS[error.code];
