import { describe, expect, it } from 'vitest';
import Diff from '../src/content/Diff.astro';
import { renderDom } from './render';

const LINES = [
  { kind: 'ctx', text: 'const a = 1;' },
  { kind: 'del', text: 'const b = 2;' },
  { kind: 'add', text: 'const b = 3;' },
] as const;

const BASE = {
  caption: 'Changement de b',
  lines: LINES,
  addedLabel: 'Ajouté',
  removedLabel: 'Supprimé',
};

const render = (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Diff, { props: { ...BASE, ...props } });

describe('Diff (rendu)', () => {
  it('nomme la région défilante par la légende et la rend focalisable', async () => {
    const region = (await render()).querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe('Changement de b');
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  it('rend la légende dans un figcaption', async () => {
    const caption = (await render()).querySelector('figure > figcaption');
    expect(caption?.textContent).toBe('Changement de b');
  });

  it('rend un pre avec une ligne par entrée', async () => {
    const pre = (await render()).querySelector('pre');
    expect(pre?.querySelectorAll('.line')).toHaveLength(LINES.length);
  });

  it('utilise ins pour l’ajout et del pour la suppression', async () => {
    const document = await render();
    expect(document.querySelectorAll('ins')).toHaveLength(1);
    expect(document.querySelectorAll('del')).toHaveLength(1);
    expect(document.querySelector('ins')?.textContent).toContain('const b = 3;');
    expect(document.querySelector('del')?.textContent).toContain('const b = 2;');
  });

  it('porte un signe visible par type de ligne', async () => {
    const signs = [...(await render()).querySelectorAll('.sign')].map((el) => el.textContent);
    expect(signs).toEqual([' ', '-', '+']);
  });

  it('masque les signes aux lecteurs d’écran', async () => {
    const signs = [...(await render()).querySelectorAll('.sign')];
    expect(signs.every((el) => el.getAttribute('aria-hidden') === 'true')).toBe(true);
  });

  it('lit les libellés addedLabel et removedLabel', async () => {
    const document = await render();
    expect(document.querySelector('ins .hidden')?.textContent?.trim()).toBe('Ajouté');
    expect(document.querySelector('del .hidden')?.textContent?.trim()).toBe('Supprimé');
  });

  it('reprend d’autres libellés', async () => {
    const document = await render({ addedLabel: 'Added', removedLabel: 'Removed' });
    expect(document.querySelector('ins .hidden')?.textContent?.trim()).toBe('Added');
    expect(document.querySelector('del .hidden')?.textContent?.trim()).toBe('Removed');
  });

  it('n’ajoute aucun libellé aux lignes de contexte', async () => {
    const document = await render();
    expect(document.querySelectorAll('.hidden')).toHaveLength(2);
    expect(document.querySelector('span.line .hidden')).toBeNull();
  });

  it('transmet `class` à côté de pp-diff', async () => {
    const figure = (await render({ class: 'placement' })).querySelector('figure');
    expect(figure?.classList.contains('pp-diff')).toBe(true);
    expect(figure?.classList.contains('placement')).toBe(true);
  });

  it('échappe le texte des lignes', async () => {
    const document = await render({ lines: [{ kind: 'add', text: '<b>x</b>' }] });
    expect(document.querySelector('pre b')).toBeNull();
    expect(document.querySelector('ins')?.textContent).toContain('<b>x</b>');
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render()).querySelectorAll('[style]')).toHaveLength(0);
  });
});
