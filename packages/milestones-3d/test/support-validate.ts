import { MilestonesError } from '../src/error.ts';
import type { ErrorCode } from '../src/error.ts';
import { validateData } from '../src/validate.ts';

export const one = { id: 'a', label: 'Un', status: 'achieved' };

/** Le code de l'erreur levée par `validateData`, ou `undefined` si l'entrée est acceptée. */
export function codeOf(input: unknown): ErrorCode | undefined {
  try {
    validateData(input);
  } catch (error) {
    return error instanceof MilestonesError ? error.code : undefined;
  }
  return undefined;
}
