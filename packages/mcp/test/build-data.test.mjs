import { describe, expect, it } from 'vitest';
import { buildData, OUT, run, serialize, SOURCES } from '../scripts/build-data.ts';
import * as parse from '../scripts/parse-component.ts';

// Format de apps/docs/scripts/markdown.mjs ; « # Démo » et « ## Titre 2 » imitent un exemple.
const BUTTON = [
  '# Button · Design system · Paul Perigault\n\nSource : https://design.paulperigault.dev/button/',
  '# Button\n\n## À quoi il sert\n\nButton rend un bouton natif,\nou un lien.',
  '## Quand l’utiliser\n\n- Déclencher une action.\n\n## Quand ne pas l’utiliser\n\n- Naviguer.',
  '## Exemples\n\n### Défaut\n\n# Démo\n\n## Titre 2\n\n```\nfunction demo() {}\n```',
  '```\n<Button type="submit">Envoyer</Button>\n```\n\n## Accessibilité\n\n### Clavier\n\n- Tab.',
  '### Lecteur d’écran\n\n- Nom du slot.\n\n### Garanti par le composant\n\n- type="button".',
  '### À la charge de l’intégrateur\n\n- Un libellé.\n\n## Propriétés\n\n*Propriétés de Button*',
  '| Propriété | Type | Défaut | Description |\n| --- | --- | --- | --- |',
  '| tone | "primary" \\| "quiet" | — | Importance. |\n| id (obligatoire) | string | — | Id. |',
  '## Jetons utilisés\n\n- `--pp-color-accent`\n\n## Preuves et décisions\n\n- [WCAG 2.4.7](x)',
].join('\n\n');
const LOG =
  '| Id | Date |\n| --- |\n| D-002 | d | Deux \\| trois | a | r |\n| D-001 | d | Un | a | r |';
const color = (hex) => ({ '--pp-color-fg': { oklch: 'oklch(50% 0 0)', hex } });
const item = { name: 'button', files: [{ path: 'packages/astro/src/forms/Button.astro' }] };
const pairs = [{ fg: 'color.fg', bg: 'color.bg', min: 7, norm: 'n' }];
const tokens = { themes: { dark: color('#2'), light: color('#1') }, base: { '--pp-space-s': '1' } };
const FILES = {
  'apps/docs/dist/components/button.md': BUTTON,
  'apps/docs/dist/index.md': '# Accueil · DS\n\nSource : https://x/\n\nBienvenue.',
  [SOURCES.registry]: JSON.stringify({ items: [item] }),
  [SOURCES.tokens]: JSON.stringify(tokens),
  [SOURCES.roles]: JSON.stringify({ pairs }),
  'docs/adr/0003-mcp.md': '# ADR-0003 — Serveur MCP\n\nTexte.',
  'docs/adr/notes.txt': 'ignoré',
  [SOURCES.decisions]: LOG,
};

/** FS en mémoire ; `reverse` inverse l'ordre des listes pour éprouver le tri. */
function memoryIo(files, reverse = false) {
  const store = new Map(Object.entries(files));
  const errors = [];
  const list = (dir) => {
    const names = [...store.keys()].filter((p) => p.startsWith(`${dir}/`));
    const relative = names.map((p) => p.slice(dir.length + 1));
    return reverse ? relative.reverse() : relative;
  };
  const read = (path) => store.get(path);
  const write = (path, text) => store.set(path, text);
  const format = async (_name, text) => text;
  const exists = (path) => store.has(path);
  return { store, errors, list, read, write, format, exists, err: (t) => errors.push(t) };
}

describe('parse-component', () => {
  it('fiche : rôle, usages, exemple, accessibilité, propriétés, jetons, preuves', () => {
    const parsed = parse.parseComponent('button', BUTTON);
    expect(parsed).toMatchObject({ slug: 'button', title: 'Button', avoid: ['Naviguer.'] });
    expect(parsed.summary).toBe('Button rend un bouton natif, ou un lien.');
    expect(parsed.use).toEqual(['Déclencher une action.']);
    expect(parsed.snippet).toBe('<Button type="submit">Envoyer</Button>');
    expect(Object.entries(parsed.a11y).flat(2).join('|')).toBe(
      'keyboard|Tab.|screenReader|Nom du slot.|guaranteed|type="button".|integrator|Un libellé.',
    );
    expect(parsed.props.map((p) => p.type)).toEqual(['"primary" | "quiet"', 'string']);
    expect(parsed.props[1]).toMatchObject({ name: 'id (obligatoire)', description: 'Id.' });
    expect([parsed.tokens, parsed.evidence]).toEqual([['--pp-color-accent'], ['[WCAG 2.4.7](x)']]);
  });

  it('page, ADR, journal des décisions, ligne de tableau', () => {
    const page = parse.pageMeta(FILES['apps/docs/dist/index.md']);
    expect(page).toEqual({ title: 'Accueil', url: 'https://x/', body: 'Bienvenue.' });
    const adr = parse.parseAdr('0003-mcp.md', '# ADR-0003 — Serveur MCP\n');
    expect(adr).toMatchObject({ id: 'ADR-0003', title: 'Serveur MCP' });
    expect(parse.parseAdr('README.md', '# x')).toBe(undefined);
    expect(parse.parseDecisionLog(LOG).map((d) => d.decision)).toEqual(['Deux | trois', 'Un']);
    expect(parse.splitRow('| a \\| b | c |')).toEqual(['a | b', 'c']);
  });
});

describe('build-data', () => {
  it('déterministe : deux exécutions identiques, quel que soit l’ordre des listes', () => {
    const first = buildData(memoryIo(FILES));
    expect(buildData(memoryIo(FILES))).toEqual(first);
    expect(buildData(memoryIo(FILES, true))).toEqual(first);
    expect(Object.keys(first)).toEqual(['components.json', 'tokens.json', 'adr.json', 'docs.json']);
  });

  it('JSON trié, indenté de deux espaces, une seule fin de ligne', () => {
    const json = buildData(memoryIo(FILES))['tokens.json'];
    expect(json).toMatch(/^\{\n {2}"base": \{\n {4}"--pp-space-s"[\s\S]*\}\n$/);
    expect(JSON.parse(json).pairs[0]).toMatchObject({ fg: '--pp-color-fg', bg: '--pp-color-bg' });
    expect(serialize({ b: 1, a: [{ d: 1, c: 2 }] })).toBe(serialize({ a: [{ c: 2, d: 1 }], b: 1 }));
  });

  it('groupe tiré du registre, ADR et décisions triées, pages', () => {
    const files = buildData(memoryIo(FILES));
    expect(JSON.parse(files['components.json'])[0]).toMatchObject({ group: 'forms' });
    const { adrs, decisions } = JSON.parse(files['adr.json']);
    expect([...adrs, ...decisions].map((d) => d.id)).toEqual(['ADR-0003', 'D-001', 'D-002']);
    const paths = JSON.parse(files['docs.json']).map((d) => d.path);
    expect(paths).toEqual(['components/button.md', 'index.md']);
  });

  it('écrit data/ ; --check passe (0), puis échoue (1) et liste les fichiers périmés', async () => {
    const io = memoryIo(FILES);
    expect(await run([], io)).toBe(0);
    expect(await run(['--check'], io)).toBe(0);
    io.store.set(`${OUT}/docs.json`, '[]\n');
    io.store.delete(`${OUT}/adr.json`);
    expect(await run(['--check'], io)).toBe(1);
    expect(io.errors.at(-1)).toMatch(/adr\.json, docs\.json/);
    expect(io.store.get(`${OUT}/docs.json`)).toBe('[]\n');
  });

  it('documentation non construite : erreur claire', () => {
    const files = Object.fromEntries(Object.entries(FILES).filter(([p]) => !p.startsWith('apps/')));
    expect(() => buildData(memoryIo(files))).toThrow(/build de apps\/docs/);
  });
});
