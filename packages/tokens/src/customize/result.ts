/** Erreurs typées des entrées du build : union fermée à champ `code`, jamais de `throw`. */
export const CUSTOMIZE_ERROR_CODES = [
  'build.hue-missing',
  'build.hue-not-finite',
  'build.hue-out-of-range',
  'build.contrast-failed',
  'build.derivation-failed',
  'build.stack-empty',
  'build.stack-too-long',
  'build.stack-unsafe',
  'build.bad-usage',
] as const;

export type CustomizeErrorCode = (typeof CUSTOMIZE_ERROR_CODES)[number];

export interface CustomizeError {
  readonly code: CustomizeErrorCode;
  readonly message: string;
}

export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: CustomizeError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(code: CustomizeErrorCode, message: string): Result<T> => ({
  ok: false,
  error: { code, message },
});
