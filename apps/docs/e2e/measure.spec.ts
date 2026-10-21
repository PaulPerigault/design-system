import { expect, test } from '@playwright/test';
import { VIEWPORTS, open } from './helpers';

/** Longueur de ligne visée pour le texte courant (convention typographique, Bringhurst). */
const MIN_CHARS = 60;
const MAX_CHARS = 75;
const TEXT =
  'La documentation décrit chaque composant avec ses exemples rendus, ses propriétés et les ' +
  'contrôles d’accessibilité qui la vérifient. Les tokens viennent d’une source unique, et ' +
  'chaque couleur est contrôlée par le calcul du contraste sur le rendu réel, dans les deux ' +
  'thèmes. Le texte courant reste lisible quand la ligne garde une longueur raisonnable, ni ' +
  'trop courte ni trop longue, quelle que soit la largeur de la fenêtre du navigateur.';

/** Caractères de chaque ligne pleine d'un paragraphe à la mesure (exécuté dans la page). */
async function fullLines(text: string): Promise<number[]> {
  await document.fonts.ready;
  const paragraph = document.createElement('p');
  paragraph.className = 'docs-prose';
  for (const word of text.split(' ')) {
    const span = document.createElement('span');
    span.textContent = `${word} `;
    paragraph.append(span);
  }
  document.querySelector('main')?.append(paragraph);
  const lines = new Map<number, string>();
  for (const span of paragraph.querySelectorAll('span')) {
    const top = Math.round(span.getBoundingClientRect().top);
    lines.set(top, (lines.get(top) ?? '') + (span.textContent ?? ''));
  }
  return [...lines.values()].slice(0, -1).map((line) => line.trim().length);
}

test(`mesure : ${MIN_CHARS} à ${MAX_CHARS} caractères par ligne pleine en moyenne`, async ({
  page,
}, testInfo) => {
  await open(page, '/components/prose/', VIEWPORTS[0]);
  const lengths = await page.evaluate(fullLines, TEXT);
  const mean = lengths.reduce((sum, length) => sum + length, 0) / lengths.length;
  testInfo.annotations.push({ type: 'caractères par ligne', description: lengths.join(', ') });
  // Une ligne isolée varie avec la césure des mots : la moyenne des lignes pleines est mesurée.
  expect(lengths.length).toBeGreaterThan(2);
  expect(mean).toBeGreaterThanOrEqual(MIN_CHARS);
  expect(mean).toBeLessThanOrEqual(MAX_CHARS);
});
