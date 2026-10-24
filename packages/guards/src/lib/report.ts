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

export function report(io: import('./io.ts').GuardIo, { name, problems, checked }: { name: string; problems: Problem[]; checked: number }): 0 | 1 {
  for (const problem of problems) io.err(formatProblem(problem));
  if (problems.length === 0) {
    io.out(`${name} : OK (${checked} fichiers)`);
    return 0;
  }
  io.out(`${name} : ${problems.length} problème(s) sur ${checked} fichiers`);
  return 1;
}
