// Erreurs typées de pp-guards : une erreur d'usage ou de configuration (code de sortie 2).

export class GuardUsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GuardUsageError';
  }
}
