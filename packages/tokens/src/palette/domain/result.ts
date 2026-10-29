import type { PaletteError, PaletteErrorCode } from '../errors.ts';
import { paletteError } from '../errors.ts';

export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: PaletteError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(code: PaletteErrorCode, message: string, path = ''): Result<T> => ({
  ok: false,
  error: paletteError(code, message, path),
});
