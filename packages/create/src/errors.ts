// Erreurs typées de `create` : un code littéral par cas, le message et le contexte utile.
// Aucune erreur anonyme ne franchit une frontière de couche (ADR-0006, décision 1).

export type CreateErrorCode =
  | 'io.cwd-relative'
  | 'lock.unreadable'
  | 'lock.version'
  | 'lock.items'
  | 'lock.entry'
  | 'registry.package-missing'
  | 'registry.fragment-json'
  | 'registry.fragment-shape'
  | 'registry.fragment-path'
  | 'registry.item-missing'
  | 'registry.path-outside'
  | 'package.unreadable'
  | 'package.version-missing'
  | 'package.version-empty'
  | 'template.versions-invalid'
  | 'site.version-invalid'
  | 'theme.invalid'
  | 'theme.template';

export type ErrorContext = Readonly<Record<string, string>>;

export class CreateError extends Error {
  readonly code: CreateErrorCode;
  readonly context: ErrorContext;

  constructor(
    code: CreateErrorCode,
    message: string,
    context: ErrorContext = {},
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'CreateError';
    this.code = code;
    this.context = context;
  }
}
