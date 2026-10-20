import { describe, expect, it } from 'vitest';
import { parseTask } from './task.mjs';

const TASK = `---
id: T5.04
title: Select natif
engine: kiro            # kiro | claude
agent: ds-worker
tier: std
files:
  - packages/astro/src/forms/Select.astro
  - packages/astro/test/Select.test.ts
acceptance:
  - npx vitest run --project astro
depends_on: [T4.01, T5.08]
---
Énoncé court.
`;

describe('parseTask', () => {
  it('garde les guillemets d’une commande, ne retire que ceux qui encadrent la valeur', () => {
    const text = TASK.replace(
      '  - npx vitest run --project astro',
      '  - node -e "JSON.parse(\'{}\')"\n  - "npm test"',
    ).replace('title: Select natif', "title: 'Select natif'");
    const task = parseTask(text);
    expect(task.acceptance).toEqual(['node -e "JSON.parse(\'{}\')"', 'npm test']);
    expect(task.title).toBe('Select natif');
  });

  it('lit le front matter (commentaires, listes en bloc et en ligne) et l’énoncé', () => {
    const task = parseTask(TASK);
    expect(task).toMatchObject({
      id: 'T5.04',
      engine: 'kiro',
      tier: 'std',
      effort: 'medium',
      body: 'Énoncé court.',
    });
    expect(task.files).toHaveLength(2);
    expect(task.depends_on).toEqual(['T4.01', 'T5.08']);
  });

  it.each([
    [TASK.replace('tier: std', 'tier: turbo'), /tier inconnu/],
    [
      TASK.replace('  - packages/astro/test/Select.test.ts\n', '  - ../hors.ts\n'),
      /chemins relatifs/,
    ],
    [TASK.replace(/acceptance:\n.*\n/, ''), /acceptance/],
    ['pas de front matter', /front matter/],
  ])('refuse une tâche invalide', (text, reason) => {
    expect(() => parseTask(text)).toThrow(reason);
  });
});
