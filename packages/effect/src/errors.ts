// Erreurs typées de l'option Effect : un nom littéral par cas, comme les `*Error` du cœur,
// exprimées en erreurs Effect (`Schema.TaggedError`).
import { Schema } from 'effect';

/** Un port de système de fichiers a échoué (lecture, écriture, existence). */
export class FileSystemError extends Schema.TaggedError<FileSystemError>()('FileSystemError', {
  operation: Schema.String,
  path: Schema.String,
  reason: Schema.String,
}) {}

/** Une valeur qui franchit une frontière est refusée par sa validation. */
export class ValidationError extends Schema.TaggedError<ValidationError>()('ValidationError', {
  field: Schema.String,
  message: Schema.String,
}) {}

/** Une requête réseau a échoué : réseau, ou statut hors 2xx. */
export class FetchError extends Schema.TaggedError<FetchError>()('FetchError', {
  url: Schema.String,
  reason: Schema.String,
}) {}
