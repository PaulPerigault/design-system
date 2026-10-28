import type { DatavizError, ErrorCode } from '../errors.ts';
import { error } from '../errors.ts';

export type Result<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: DatavizError };

export const ok = <T>(value: T): Result<T> => ({ ok: true, value });

export const fail = <T = never>(code: ErrorCode, message: string, path = ''): Result<T> => ({
  ok: false,
  error: error(code, message, path),
});
