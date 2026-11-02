import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compareAll, parseTracking, report } from './check-upstream.mjs';

const OLD = 'a'.repeat(40);
const NEW = 'b'.repeat(40);
const registry = [
  '# Registre',
  '## Suivi amont (lu par le contrôle)',
  '| Skill | Dépôt | SHA relu |',
  '| --- | --- | --- |',
  `| encre-un | auteur/depot-un | \`${OLD}\` |`,
  `| encre-deux | auteur/depot-un | \`${OLD}\` |`,
  `| encre-trois | auteur/depot-trois | \`${OLD}\` |`,
  `| encre-faux | pas un dépôt | \`${OLD}\` |`,
  '## Candidats vus',
  `| encre-hors | auteur/hors | \`${OLD}\` |`,
].join('\n');

describe('parseTracking', () => {
  it('lit les lignes valides du seul tableau de suivi', () => {
    expect(parseTracking(registry).map((entry) => entry.skill)).toEqual([
      'encre-un',
      'encre-deux',
      'encre-trois',
    ]);
  });
  it('ignore une ligne sans SHA complet et un registre sans section', () => {
    expect(parseTracking('| encre-x | a/b | `abc` |')).toEqual([]);
    expect(parseTracking('rien')).toEqual([]);
  });
  it('lit le vrai registre du dépôt', () => {
    const real = parseTracking(readFileSync('docs/design/skills-registre.md', 'utf8'));
    expect(real.length).toBeGreaterThan(0);
  });
});

describe('compareAll', () => {
  const fetchHead = async (repo) => {
    if (repo === 'auteur/depot-trois') throw new Error('HTTP 403');
    return repo === 'auteur/depot-un' ? NEW : OLD;
  };
  it('interroge chaque dépôt une fois et classe chaque ligne', async () => {
    const calls = [];
    const results = await compareAll(parseTracking(registry), async (repo) => {
      calls.push(repo);
      return fetchHead(repo);
    });
    expect(calls).toEqual(['auteur/depot-un', 'auteur/depot-trois']);
    expect(results.map((result) => result.status)).toEqual(['changé', 'changé', 'indisponible']);
    expect(results[2].detail).toBe('HTTP 403');
  });
  it('refuse une réponse qui n’est pas un SHA', async () => {
    const [result] = await compareAll(parseTracking(registry).slice(0, 1), async () => '<html>');
    expect(result.status).toBe('indisponible');
  });
  it('marque inchangé un SHA identique', async () => {
    const [result] = await compareAll(parseTracking(registry).slice(0, 1), async () => OLD);
    expect(result.status).toBe('inchangé');
  });
});

describe('report', () => {
  it('liste les changements et donne le lien de comparaison', async () => {
    const results = await compareAll(parseTracking(registry).slice(0, 1), async () => NEW);
    const text = report(results).join('\n');
    expect(text).toContain('SHA changés : 1');
    expect(text).toContain(`compare/${OLD}...${NEW}`);
  });
  it('ne dit rien à relire quand tout est inchangé', async () => {
    const results = await compareAll(parseTracking(registry).slice(0, 1), async () => OLD);
    expect(report(results).join('\n')).not.toContain('À relire');
  });
  it('compte les amonts indisponibles dans la synthèse', async () => {
    const results = await compareAll(parseTracking(registry).slice(0, 1), async () => {
      throw new Error('HTTP 403');
    });
    expect(report(results).join('\n')).toContain('indisponibles : 1');
  });
});
