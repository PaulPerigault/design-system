// Erreurs typées de l'option Effect : un nom littéral par cas, comme les `*Error` du cœur
// (ADR-0006, décision 1), exprimées en erreurs Effect (`Schema.TaggedError`, ADR-0010).
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
