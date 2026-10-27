import type { GuardIo } from './io.ts';
export interface Problem {
  file: string;
  line?: number;
  message: string;
}

/** Erreur d'usage ou de configuration (code de sortie 2). */
export class GuardUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardUsageError';
  }
}

function formatProblem({ file, line, message }: Problem): string {
  return line === undefined ? `${file}: ${message}` : `${file}:${line}: ${message}`;
}

export interface Summary {
  name: string;
  problems: Problem[];
  checked: number;
}

export function report(io: GuardIo, { name, problems, checked }: Summary): 0 | 1 {
  for (const problem of problems) io.err(formatProblem(problem));
  if (problems.length === 0) {
    io.out(`${name} : OK (${checked} fichiers)`);
    return 0;
  }
  io.out(`${name} : ${problems.length} problème(s) sur ${checked} fichiers`);
  return 1;
}
