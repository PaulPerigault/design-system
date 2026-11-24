import { describe, expect, it } from 'vitest';
import { getComponent, listComponents } from '../src/application/tools-components.ts';
import { toolList } from '../src/application/tools.ts';
import { loadData } from '../src/infrastructure/data.ts';

// Données embarquées réelles : le composant entre par `components.json`, sans huitième outil.
const data = loadData();
const slug = 'milestones-3d';

describe('Milestones3D dans les données embarquées du MCP', () => {
  it('apparaît dans list_components, au groupe des contenus', () => {
    const { components } = listComponents(data.components);
    const found = components.find((component) => component.slug === slug);
    expect(found?.title).toBe('Milestones3D');
    expect(found?.group).toBe('content');
  });

  it('get_component rend ses sept propriétés, son extrait et ses notes d’accessibilité', () => {
    const component = getComponent(data.components, { slug });
    const names = component.props.map((prop) => prop.name.replace(/ \(obligatoire\)|`/g, ''));
    expect(names).toEqual([
      'milestones',
      'goal',
      'label',
      'locale',
      'labels',
      'endId',
      'reserve',
      'class',
    ]);
    expect(component.snippet).toContain('<Milestones3D');
    expect(component.snippet).toContain("install } from '@paulperigault/astro/milestones-3d'");
    expect(component.a11y.screenReader.join(' ')).toContain('aria-hidden');
  });

  it('get_component rend les jetons consommés, tous connus de tokens.json', () => {
    const { tokens } = getComponent(data.components, { slug });
    for (const token of ['--pp-color-accent', '--pp-size-target-min', '--pp-color-bg']) {
      expect(tokens).toContain(token);
    }
    const known = new Set([
      ...Object.keys(data.tokens.base),
      ...Object.keys(data.tokens.themes.light),
      ...Object.keys(data.tokens.themes.dark),
    ]);
    expect(tokens.filter((token) => !known.has(token))).toEqual([]);
  });

  it('cite l’ADR-0012 et ses conditions de chargement dans la documentation', () => {
    const page = data.docs.find((doc) => doc.path === 'components/milestones-3d.md');
    expect(page?.body).toContain('Quand la 3D se charge');
    expect(page?.body).toContain("'wasm-unsafe-eval'");
    expect(data.decisions.adrs.some((adr) => adr.id === 'ADR-0012')).toBe(true);
  });

  it('garde sept outils : aucun outil propre au composant', () => {
    const analyze = () => [];
    const names = toolList({ data, analyze, ruleIds: [] }).map((tool) => tool.name);
    expect(names).toHaveLength(7);
    expect(names.filter((name) => /milestone|3d|scene/i.test(name))).toEqual([]);
  });
});
