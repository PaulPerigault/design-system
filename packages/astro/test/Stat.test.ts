import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Stat from '../src/content/Stat.astro';
import { renderDom } from './render';

const TRENDS = ['up', 'down', 'flat'] as const;

const render = async (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Stat, { props: { label: 'Visites', value: '1 204', ...props } });

const root = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const element = (await render(props)).querySelector('dl.pp-stat');
  if (!element) throw new Error('racine dl.pp-stat absente');
  return element;
};

describe('Stat (rendu)', () => {
  it('rend une liste de description avec un dt et un dd de valeur', async () => {
    const element = await root();
    expect(element.tagName.toLowerCase()).toBe('dl');
    expect(element.querySelectorAll('dt')).toHaveLength(1);
    expect(element.querySelectorAll('dd')).toHaveLength(1);
  });

  it('écrit le label dans dt et la valeur dans dd', async () => {
    const element = await root({ label: 'Erreurs', value: '12' });
    expect(element.querySelector('dt')?.textContent?.trim()).toBe('Erreurs');
    expect(element.querySelector('dd')?.textContent?.trim()).toBe('12');
  });

  it('ne pose aucun rôle', async () => {
    const document = await render({ delta: '+3', trend: 'up' });
    expect(document.querySelectorAll('[role]')).toHaveLength(0);
  });

  it('n’affiche ni delta ni icône sans delta', async () => {
    const element = await root();
    expect(element.querySelector('.pp-stat__delta')).toBeNull();
    expect(element.querySelector('svg')).toBeNull();
  });

  it('affiche le delta en second dd, tendance flat par défaut', async () => {
    const delta = (await root({ delta: '+3 depuis la semaine dernière' })).querySelector(
      '.pp-stat__delta',
    );
    expect(delta?.tagName.toLowerCase()).toBe('dd');
    expect(delta?.getAttribute('data-trend')).toBe('flat');
    expect(delta?.textContent?.trim()).toBe('+3 depuis la semaine dernière');
  });

  it.each(TRENDS)('reporte trend="%s" dans data-trend', async (trend) => {
    const delta = (await root({ delta: 'x', trend })).querySelector('.pp-stat__delta');
    expect(delta?.getAttribute('data-trend')).toBe(trend);
  });

  it('donne une forme d’icône distincte à chaque tendance, masquée', async () => {
    const shapes = new Set<string | null | undefined>();
    for (const trend of TRENDS) {
      const icon = (await root({ delta: 'x', trend })).querySelector('svg');
      shapes.add(icon?.querySelector('path')?.getAttribute('d'));
      expect(icon?.getAttribute('aria-hidden')).toBe('true');
    }
    expect(shapes.size).toBe(TRENDS.length);
  });

  it('transmet `class` à côté de pp-stat, sans style', async () => {
    const document = await render({ delta: '+3', trend: 'up', class: 'placement' });
    const element = document.querySelector('dl');
    expect(element?.classList.contains('pp-stat')).toBe(true);
    expect(element?.classList.contains('placement')).toBe(true);
    expect(document.querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Stat (cas limites)', () => {
  it('affiche une valeur "0" sans la masquer', async () => {
    const element = await root({ value: '0' });
    expect(element.querySelector('.pp-stat__value')?.textContent?.trim()).toBe('0');
  });

  it('traite un delta vide comme absent', async () => {
    expect((await root({ delta: '   ' })).querySelector('.pp-stat__delta')).toBeNull();
  });

  it('refuse trend sans delta, ou avec un delta vide', async () => {
    await expect(render({ trend: 'up' })).rejects.toThrow('delta');
    await expect(render({ trend: 'flat', delta: '' })).rejects.toThrow('delta');
  });

  it('ne laisse aucune classe parasite sans class', async () => {
    expect((await root()).className).toBe('pp-stat');
  });
});

describe('Stat (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Stat.astro', import.meta.url), 'utf8');

  it('n’utilise que des jetons --pp-*, sans couleur brute ni effet', () => {
    const names = [...source.matchAll(/var\(--([\w-]+)/g)].map((match) => match[1]);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name?.startsWith('pp-'))).toBe(true);
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/gradient|box-shadow|text-shadow|backdrop-filter/);
  });

  it('utilise des propriétés logiques', () => {
    expect(source).not.toMatch(/\b(margin|padding)-(left|right|top|bottom)\b/);
  });
});
