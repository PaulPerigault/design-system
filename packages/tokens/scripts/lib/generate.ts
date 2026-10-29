/** Arbres DTCG → modèle d'émission → contenu de chaque fichier généré. */
import type { BuildInput } from '../../src/customize/input.ts';
import type { Result } from '../../src/customize/result.ts';
import { ok } from '../../src/customize/result.ts';
import { applyInput } from './apply-input.ts';
import { colorEntry, cssValue } from './css-value.ts';
import { emitCss } from './emit-css.ts';
import { emitDts } from './emit-dts.ts';
import { emitJson } from './emit-json.ts';
import { entries } from './flatten.ts';
import { readSource } from './read-source.ts';
import type { Model, Source } from './types.ts';

/** Arbres DTCG → modèle : tokens de base en CSS, couleurs de thème en OKLCH et hexadécimal. */
export function buildModel({ base, themes }: Source): Model {
  return {
    base: entries(base).map((token) => ({ ...token, css: cssValue(token) })),
    themes: Object.fromEntries(
      Object.entries(themes).map(([theme, tree]) => [theme, entries(tree).map(colorEntry)]),
    ),
  };
}

const emitAll = (model: Model): Record<string, string> => ({
  'tokens.css': emitCss(model),
  'tokens.json': emitJson(model),
  'tokens.d.ts': emitDts(model),
});

/** Contenu de chaque fichier généré, par nom (valeurs par défaut des sources). */
export function generate(readText: (name: string) => string): Record<string, string> {
  return emitAll(buildModel(readSource(readText)));
}

/** Idem avec la teinte d'accent et la pile de police validées ; erreur typée si la dérivation échoue. */
export function generateWith(
  readText: (name: string) => string,
  input: BuildInput,
): Result<Record<string, string>> {
  const model = applyInput(buildModel(readSource(readText)), input);
  return model.ok ? ok(emitAll(model.value)) : model;
}
