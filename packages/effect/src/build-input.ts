// Entrées de build (`accentHue`, `fontStack`) validées avec `Schema`. Mêmes règles que le cœur
// (`tokens/customize`, D-056) : un test de parité vérifie que les deux acceptent et refusent pareil.
import { Effect, Schema } from 'effect';
import { ValidationError } from './errors.ts';
import { Hue } from './validate.ts';

const MAX_STACK = 256;
const PAIR = 2;
const FORBIDDEN = /[;{}\r\n\p{Zl}\p{Zp}]|url\(|@import|\/\*|\*\//iu;
const QUOTES = ["'", '"'];
const count = (text: string, char: string): number => text.split(char).length - 1;
const balanced = (text: string): boolean =>
  QUOTES.every((quote) => count(text, quote) % PAIR === 0) && count(text, '(') === count(text, ')');

/** Pile de familles CSS : non vide, 256 caractères au plus, rien qui sorte d'une déclaration. */
export const FontStack = Schema.Trim.check(
  Schema.isNonEmpty(),
  Schema.isMaxLength(MAX_STACK),
  Schema.makeFilter((text: string) =>
    FORBIDDEN.test(text) || !balanced(text) ? 'caractères hors d’une déclaration CSS' : undefined,
  ),
);

/** Teinte : un nombre, ou son écriture décimale (argument de ligne de commande). */
const HueFromText = Schema.Trim.check(Schema.isNonEmpty()).pipe(
  Schema.decodeTo(Schema.NumberFromString.check(Schema.isBetween({ minimum: 0, maximum: 360 }))),
);
export const AccentHue = Schema.Union([Hue, HueFromText]);

/** Entrées brutes `{ accentHue?, fontStack? }` : une clé absente garde la valeur par défaut. */
export const BuildInput = Schema.Struct({
  accentHue: Schema.optionalKey(AccentHue),
  fontStack: Schema.optionalKey(FontStack),
});

/** Valide les entrées de build ; le premier refus est une `ValidationError`. */
export const parseBuildInput = (
  raw: unknown,
): Effect.Effect<typeof BuildInput.Type, ValidationError> =>
  Effect.try({
    try: () => Schema.decodeUnknownSync(BuildInput)(raw ?? {}),
    catch: (error) =>
      new ValidationError({
        field: 'build-input',
        message: error instanceof Error ? error.message : String(error),
      }),
  });
