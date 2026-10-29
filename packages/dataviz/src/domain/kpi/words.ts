import type { Formatter } from '../../application/ports.ts';
import { PERCENT } from '../numbers.ts';
import type { Result } from '../result.ts';
import { fail, ok } from '../result.ts';
import type { Direction, Variation } from './variation.ts';

export interface VariationText {
  readonly direction: Direction;
  /** Variation absolue signée : « +5 € », « −12 € », « 0 € ». */
  readonly absolute: string;
  /** Variation relative signée : « +4,2 % » ; `null` si la référence est nulle. */
  readonly relative: string | null;
  /** Phrase lue par un lecteur d'écran, le sens dit en mots : « hausse de 4,2 % ». */
  readonly sentence: string;
}

interface Vocabulary {
  readonly up: string;
  readonly down: string;
  readonly flat: string;
  readonly nearFlat: string;
  readonly of: string;
}

const VOCABULARIES: Readonly<Record<string, Vocabulary>> = {
  fr: { up: 'hausse', down: 'baisse', flat: 'stable', nearFlat: 'quasi stable', of: 'de' },
};

const SIGNS: Readonly<Record<Direction, string>> = { up: '+', down: '−', flat: '' };

const language = (locale: string): string => locale.split('-')[0] ?? locale;

const signed = (direction: Direction, magnitude: string): string =>
  `${SIGNS[direction]}${magnitude}`;

/** Le mot du sens ; « quasi stable » si l'arrondi affiché écrase une variation non nulle. */
function wording(vocabulary: Vocabulary, variation: Variation, magnitude: string, zero: string) {
  if (variation.direction === 'flat') return vocabulary.flat;
  return magnitude === zero ? vocabulary.nearFlat : vocabulary[variation.direction];
}

/**
 * Variation dite en mots et en signes (ADR-0007, décision 3) : la couleur n'est qu'un renfort.
 * La phrase privilégie la variation relative, sinon l'absolue. `format.bad-locale` si la langue du
 * formateur n'a pas de vocabulaire : mélanger deux langues serait pire qu'échouer.
 */
export function variationText(
  variation: Variation,
  unit: string,
  formatter: Formatter,
): Result<VariationText> {
  const vocabulary = VOCABULARIES[language(formatter.locale)];
  if (vocabulary === undefined) {
    return fail(
      'format.bad-locale',
      `Pas de vocabulaire de variation pour « ${formatter.locale} » : utilisez « fr ».`,
    );
  }
  const { direction, absolute, relative } = variation;
  const absoluteMagnitude = formatter.number(Math.abs(absolute), unit);
  const relativeMagnitude =
    relative === null ? null : formatter.number(Math.abs(relative) * PERCENT, '%');
  const magnitude = relativeMagnitude ?? absoluteMagnitude;
  const zero = formatter.number(0, relativeMagnitude === null ? unit : '%');
  const word = wording(vocabulary, variation, magnitude, zero);
  const quiet = word === vocabulary.flat || word === vocabulary.nearFlat;
  return ok({
    direction,
    absolute: signed(direction, absoluteMagnitude),
    relative: relativeMagnitude === null ? null : signed(direction, relativeMagnitude),
    sentence: quiet ? word : `${word} ${vocabulary.of} ${magnitude}`,
  });
}
