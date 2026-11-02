// Validation d'une valeur à la frontière avec `Schema`, erreur typée à la sortie. Exemple de la
// règle du cœur : la teinte d'accent est un nombre fini entre 0 et 360 (D-056).
import { Effect, Schema } from 'effect';
import { ValidationError } from './errors.ts';

const HUE_MIN = 0;
const HUE_MAX = 360;

/** Teinte OKLCH en degrés : nombre fini de 0 à 360. */
export const Hue = Schema.Number.check(Schema.isBetween({ minimum: HUE_MIN, maximum: HUE_MAX }));

/** Valide une valeur inconnue avec un schéma ; l'échec est une `ValidationError` du champ nommé. */
export const validate =
  <A, I>(field: string, schema: Schema.Codec<A, I>) =>
  (input: unknown): Effect.Effect<A, ValidationError> =>
    Effect.try({
      try: () => Schema.decodeUnknownSync(schema)(input),
      catch: (error) =>
        new ValidationError({
          field,
          message: error instanceof Error ? error.message : String(error),
        }),
    });
