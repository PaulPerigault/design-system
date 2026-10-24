// Orchestration : neutralise les commentaires, choisit la portée par extension, assemble les
// résultats des règles CSS, classes et texte en problèmes `fichier:ligne`.
import { lineOf } from '../lib/files.ts';
import { classHits } from './class-rules.ts';
import { cssHits } from './css-rules.ts';
import { logicalHits } from './logical-rules.ts';
import { textHits } from './text-rules.ts';

export const MESSAGES = {
  gradient: 'dégradé décoratif interdit',
  shadow: 'ombre décorative interdite',
  blur: 'flou interdit',
  emoji: 'emoji interdit',
  'spaced-caps': 'majuscules espacées interdites',
  'tailwind-palette': 'palette Tailwind par défaut interdite, utiliser les tokens --pp-*',
  'arbitrary-value': 'valeur arbitraire interdite, utiliser un token',
  'color-literal': 'couleur brute interdite, utiliser un token --pp-*',
  'retro-effect': 'effet rétro interdit (glitch, machine à écrire, scanlines)',
  'generic-phrase': 'phrase générique interdite',
  'physical-property': 'propriété physique interdite, utiliser la propriété logique',
};
export const RULE_IDS = Object.keys(MESSAGES);

interface Hit {
  rule: string;
  index: number;
  excerpt: string;
}

const MARKUP = ['.astro', '.html', '.jsx', '.tsx'];
const PROSE = ['.md', '.mdx'];
const HTML_COMMENT = /<!--[\s\S]*?-->/g;
const CSS_COMMENT = /\/\*[\s\S]*?\*\//g;
const STYLE_BLOCK = /<style\b[^>]*>([\s\S]*?)<\/style>/dgi;
const EXCERPT_MAX = 60;

const blank = (text: string): string => text.replace(/[^\n]/g, ' ');

/** Remplace les commentaires par des blancs, sauts de ligne conservés. */
function neutralize(text: string, ext: string): string {
  const patterns = PROSE.includes(ext) ? [HTML_COMMENT] : [HTML_COMMENT, CSS_COMMENT];
  return patterns.reduce((acc, pattern) => acc.replace(pattern, blank), text);
}

/** Ne garde que le contenu des `<style>` ; le reste devient blanc (index inchangés). */
function styleOnly(text: string): string {
  let kept = '';
  let position = 0;
  for (const match of text.matchAll(STYLE_BLOCK)) {
    const indices = match.indices as [number, number][];
    const [start, end] = indices[1] ?? [0, 0];
    kept += blank(text.slice(position, start)) + text.slice(start, end);
    position = end;
  }
  return kept + blank(text.slice(position));
}

function collect(ext: string, clean: string): Hit[] {
  const hits = textHits(clean);
  if (ext === '.css') hits.push(...cssHits(clean), ...logicalHits(clean));
  if (MARKUP.includes(ext)) {
    const css = styleOnly(clean);
    hits.push(...cssHits(css), ...logicalHits(css), ...classHits(clean));
  }
  return hits;
}

function excerptOf(raw: string): string {
  const flat = raw.replace(/\s+/g, ' ').trim();
  return flat.length > EXCERPT_MAX ? `${flat.slice(0, EXCERPT_MAX)}…` : flat;
}

export function analyze(file: string, text: string, enabled: ReadonlySet<string>): { file: string; line: number; rule: string; message: string }[] {
  const ext = file.slice(file.lastIndexOf('.')).toLowerCase();
  const clean = neutralize(text, ext);
  const seen = new Set<string>();
  return collect(ext, clean)
    .filter(
      ({ rule, index }) =>
        enabled.has(rule) && !seen.has(`${rule}:${index}`) && seen.add(`${rule}:${index}`),
    )
    .sort((a, b) => a.index - b.index)
    .map(({ rule, index, excerpt }) => ({
      file,
      line: lineOf(clean, index),
      rule,
      message: `règle « ${rule} » : ${MESSAGES[rule as keyof typeof MESSAGES]} (${excerptOf(excerpt)})`,
    }));
}
