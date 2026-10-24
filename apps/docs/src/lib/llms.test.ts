import { describe, expect, it } from 'vitest';
import registry from '@paulperigault/astro/registry.json';
import { GROUPS } from '../navigation';
import { buildLlms } from './llms.ts';

const SITE = 'https://design.paulperigault.dev';
const SLUGS = GROUPS.flatMap((group) => group.links.map((link) => link.slug));
const text = buildLlms({ groups: GROUPS, items: registry.items, site: SITE });
const lines = text.split('\n');
const MD_LINK =
  /^- \[[^\]]+\]\(https:\/\/design\.paulperigault\.dev\/components\/[a-z-]+\.md\): .+$/;

describe('buildLlms', () => {
  it('commence par le titre de niveau 1', () => {
    expect(lines[0]).toBe('# Design system @paulperigault');
  });

  it('cite chaque composant de la navigation, sans invoker-fallback', () => {
    const componentLinks = lines.filter((line) => line.includes('/components/'));
    expect(componentLinks).toHaveLength(SLUGS.length);
    for (const slug of SLUGS) {
      expect(text).toContain(`${SITE}/components/${slug}.md`);
    }
    expect(text).not.toContain('invoker-fallback');
  });

  it('reprend la description du registre pour chaque composant', () => {
    const stack = registry.items.find((item) => item.name === 'stack');
    expect(text).toContain(`[Stack](${SITE}/components/stack.md): ${stack?.description}`);
  });

  it('ne contient aucun lien relatif', () => {
    expect(text).not.toMatch(/\]\((?!https?:\/\/)/);
  });

  it('forme chaque lien .md de composant de façon correcte', () => {
    const mdLines = lines.filter((line) => line.includes('.md)'));
    expect(mdLines).toHaveLength(SLUGS.length);
    for (const line of mdLines) {
      expect(line).toMatch(MD_LINK);
    }
  });

  it('ne contient aucune ligne vide en double', () => {
    expect(lines.some((line, index) => line === '' && lines[index - 1] === '')).toBe(false);
    expect(text.endsWith('\n')).toBe(true);
  });

  it('expose les sections attendues dans l’ordre', () => {
    const headings = lines.filter((line) => line.startsWith('## '));
    expect(headings).toEqual([
      '## Composants',
      '## Documentation',
      '## Registre',
      '## Pour les IA',
    ]);
  });

  it('retire la barre finale du site sans produire de double barre', () => {
    const withSlash = buildLlms({ groups: GROUPS, items: registry.items, site: `${SITE}/` });
    expect(withSlash).toBe(text);
    expect(withSlash).not.toContain('//components');
  });

  it('échoue clairement pour un composant absent du registre', () => {
    const groups = [{ id: 'x', title: 'X', links: [{ slug: 'inconnu', title: 'Inconnu' }] }];
    expect(() => buildLlms({ groups, items: registry.items, site: SITE })).toThrow(
      'Composant absent du registre : « inconnu ».',
    );
  });
});
