import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import Table from '../src/content/Table.astro';
import { renderDom } from './render';

const COLUMNS = [
  { key: 'name', label: 'Nom' },
  { key: 'size', label: 'Taille', numeric: true },
];
const ROWS = [
  { name: 'Alpha', size: '12' },
  { name: 'Beta', size: '3' },
];
const CAPTION = 'Tailles des paquets';

const render = (props: Record<string, unknown> = {}): Promise<Document> =>
  renderDom(Table, { props: { caption: CAPTION, columns: COLUMNS, rows: ROWS, ...props } });

describe('Table (rendu)', () => {
  it('rend une région focalisable nommée par la légende', async () => {
    const region = (await render()).querySelector('[role="region"]');
    expect(region?.getAttribute('aria-label')).toBe(CAPTION);
    expect(region?.getAttribute('tabindex')).toBe('0');
  });

  it('rend la légende visible dans <caption>', async () => {
    expect((await render()).querySelector('table > caption')?.textContent).toBe(CAPTION);
  });

  it('rend un en-tête de colonne par colonne avec scope="col"', async () => {
    const heads = [...(await render()).querySelectorAll('thead th')];
    expect(heads.map((head) => head.textContent)).toEqual(['Nom', 'Taille']);
    expect(heads.every((head) => head.getAttribute('scope') === 'col')).toBe(true);
  });

  it('rend une ligne par entrée, sans en-tête de ligne par défaut', async () => {
    const document = await render();
    expect(document.querySelectorAll('tbody tr')).toHaveLength(ROWS.length);
    expect(document.querySelectorAll('tbody th')).toHaveLength(0);
    expect(document.querySelectorAll('tbody td')).toHaveLength(ROWS.length * COLUMNS.length);
  });

  it('rend la colonne `rowHeader` en <th scope="row">', async () => {
    const heads = [...(await render({ rowHeader: 'name' })).querySelectorAll('tbody th')];
    expect(heads.map((head) => head.textContent)).toEqual(['Alpha', 'Beta']);
    expect(heads.every((head) => head.getAttribute('scope') === 'row')).toBe(true);
  });

  it('marque les colonnes numériques par data-numeric, en-tête et cellules', async () => {
    const document = await render();
    expect(document.querySelectorAll('[data-numeric]')).toHaveLength(ROWS.length + 1);
    expect(document.querySelector('thead th[data-numeric]')?.textContent).toBe('Taille');
  });

  it('rend une cellule vide quand la clé manque', async () => {
    const document = await render({ rows: [{ name: 'Gamma' }] });
    expect(document.querySelectorAll('tbody td')[1]?.textContent).toBe('');
  });

  it('transmet `class` à côté de pp-table', async () => {
    const region = (await render({ class: 'placement' })).querySelector('.pp-table');
    expect(region?.classList.contains('placement')).toBe(true);
  });

  it('ne pose aucun attribut style', async () => {
    expect((await render({ rowHeader: 'name' })).querySelectorAll('[style]')).toHaveLength(0);
  });
});

describe('Table (source CSS)', () => {
  const source = readFileSync(new URL('../src/content/Table.astro', import.meta.url), 'utf8');

  it('aligne les colonnes numériques en fin, en chiffres tabulaires', () => {
    expect(source).toMatch(/\[data-numeric\]\s*\{\s*text-align:\s*end;/);
    expect(source).toContain('font-variant-numeric: tabular-nums');
  });

  it('trace les filets avec --pp-color-line', () => {
    expect(source).toContain('var(--pp-color-line)');
  });
});
