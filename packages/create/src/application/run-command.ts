import { CODE_USAGE, messageOf } from '../domain/snippet.ts';
import type { CreateIo } from './ports.ts';

/**
 * Lance une commande ; une erreur qu'elle lève (paquet introuvable avec `--from`, verrou illisible)
 * devient un message sur `io.err` et le code d'usage, comme les échecs qu'elle signale elle-même.
 */
export function runCommand(io: CreateIo, task: () => number): number {
  try {
    return task();
  } catch (error) {
    io.err(messageOf(error));
    return CODE_USAGE;
  }
}
