import { describe, expect, it } from 'vitest';
import { GOAL, ids, items, render } from './Milestones3D.fixtures';

/** Premier élément correspondant : l'absence fait échouer le test, pas une chaîne `?.`. */
const one = (root: Element, selector: string): Element => {
  const found = root.querySelector(selector);
  if (!found) throw new Error(`absent : ${selector}`);
  return found;
};
const text = (root: Element, selector: string): string => one(root, selector).textContent ?? '';
const attr = (root: Element, selector: string, name: string): string | null =>
  one(root, selector).getAttribute(name);
const item = async (index: number, props = {}): Promise<Element> =>
  items(await render(props))[index] as Element;
const FOLLOWING = 4;

describe('Milestones3D (empreinte réservée, ADR-0014)', () => {
  it('pose data-reserve et le nombre d’étapes (jalons et objectif) par défaut', async () => {
    const root = await render({ goal: GOAL });
    expect(root.getAttribute('data-reserve')).toBe('on');
    expect(root.getAttribute('data-pp-count')).toBe('5');
  });

  it('ne réserve rien avec reserve={false}', async () => {
    const root = await render({ reserve: false });
    expect(root.hasAttribute('data-reserve')).toBe(false);
  });
});

describe('Milestones3D (rendu serveur complet, sans JavaScript)', () => {
  it('rend une liste role="list" triée par date, un jalon sans date derrière le précédent', async () => {
    const root = await render();
    expect(attr(root, 'ol', 'role')).toBe('list');
    expect(ids(root)).toEqual(['alpha', 'beta', 'sans-date', 'gamma']);
  });

  it('place l’objectif en dernier dans la liste, avec son lien', async () => {
    const root = await render({ goal: GOAL });
    expect(ids(root).at(-1)).toBe('@goal');
    expect(text(root, '[data-pp-goal]')).toContain('Objectif');
    expect(attr(root, '[data-pp-goal] a', 'href')).toBe('https://example.org/cible');
    expect((await render()).querySelector('[data-pp-goal]')).toBeNull();
  });

  it('écrit date, émetteur, nom, code et statut en toutes lettres', async () => {
    const first = await item(0);
    expect(text(first, 'time')).toBe('mars 2025');
    expect(attr(first, 'time', 'datetime')).toBe('2025-03');
    expect(attr(first, 'time', 'data-pp-short')).toBe('mars 2025');
    expect(text(first, '.pp-milestones__group')).toBe('Émetteur');
    expect(text(first, '[data-pp-name]')).toBe('Premier jalon');
    expect(text(first, '[data-pp-code]')).toBe('ABC-101');
    expect(text(first, '.pp-milestones__status')).toBe('Obtenu');
    expect(text(await item(3), '.pp-milestones__status')).toBe('Prévu');
  });

  it('formate les dates dans la langue demandée', async () => {
    expect(text(await item(0, { locale: 'en' }), 'time')).toBe('March 2025');
  });

  it('pose le badge en <img> sans alt bruyant, avec dimensions et chargement différé', async () => {
    const img = one(await item(0), 'img');
    const read = (name: string): string | null => img.getAttribute(name);
    expect([read('src'), read('alt'), read('width'), read('height')]).toEqual([
      '/badges/alpha.webp',
      '',
      '512',
      '512',
    ]);
    expect([read('loading'), read('decoding')]).toEqual(['lazy', 'async']);
    expect(img.closest('.pp-milestones__medal')).not.toBeNull();
  });

  it('ne rend ni badge pour un jalon sans badge, ni aucun emblème', async () => {
    const root = await render();
    expect(items(root)[1]?.querySelector('img')).toBeNull();
    expect(root.querySelector('[data-emblem], .pp-milestones__emblem, svg')).toBeNull();
  });

  it('lie la vérification : nom accessible, rel pour un lien externe seulement', async () => {
    const link = one(await item(0), 'a');
    expect(link.textContent?.trim()).toBe('Vérifier sur Credly');
    expect(link.getAttribute('aria-label')).toBe('Vérifier sur Credly : Premier jalon');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(one(await item(3), 'a').hasAttribute('rel')).toBe(false);
  });

  it('accepte un texte de vérification traduit', async () => {
    const link = one(await item(0, { labels: { verify: 'Verify' } }), 'a');
    expect(link.textContent?.trim()).toBe('Verify');
  });

  it('rend une région de détail masquée, non annoncée, avec un article masqué par étape', async () => {
    const root = await render({ goal: GOAL });
    const panel = one(root, '[data-pp-panel]');
    expect([panel.hasAttribute('hidden'), panel.getAttribute('role')]).toEqual([true, 'region']);
    expect(panel.getAttribute('aria-label')).toBe('Détail du jalon');
    expect(panel.hasAttribute('aria-live')).toBe(false);
    const details = Array.from(root.querySelectorAll('[data-pp-detail]'));
    expect(details.map((d) => d.getAttribute('data-pp-detail'))).toEqual(ids(root).map((id) => id));
    expect(details.every((d) => d.hasAttribute('hidden'))).toBe(true);
  });

  it('écrit dans le détail la description, le badge sans alt et le lien de vérification', async () => {
    const alpha = one(await render(), '[data-pp-detail="alpha"]');
    expect(alpha.textContent).toContain('Obtenu en mars.');
    expect(attr(alpha, 'img', 'alt')).toBe('');
    expect(attr(alpha, 'a', 'href')).toBe('https://example.org/verifier/alpha');
  });

  it('offre « Passer cette section » vers une ancre située après la piste', async () => {
    const root = await render({ label: 'Mon parcours' });
    const target = one(root, '.pp-milestones__end');
    expect(text(root, '.pp-milestones__skip')).toBe('Passer cette section');
    expect(attr(root, '.pp-milestones__skip', 'href')).toBe(`#${target.id}`);
    expect(target.id).toBe('pp-milestones-end-mon-parcours');
    expect(one(root, '[data-pp-track]').compareDocumentPosition(target)).toBe(FOLLOWING);
  });
});
