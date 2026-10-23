import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import * as adr from './adr.ts';

const ADR_DIR = fileURLToPath(new URL('../../../../docs/adr/', import.meta.url));
const FIXTURE = `# ADR-0009 — Exemple de décision

- Statut : proposé (2026-01-02). Décision pour la version locale ; la suite
  reste à construire.
- Référence : \`docs/x.md\`.

## Contexte

Le **texte** du contexte tient sur \`une\` ligne, puis \`code\` est cité.

Second paragraphe, ignoré.
`;

describe('adrId et adrTitle', () => {
  it('lit les quatre chiffres du nom et le titre, sinon lève une erreur', () => {
    expect(adr.adrId('../docs/adr/0003-mcp.md')).toBe('0003');
    expect(adr.adrTitle(FIXTURE)).toBe('ADR-0009 — Exemple de décision');
    expect(() => adr.adrId('mcp.md')).toThrow();
    expect(() => adr.adrTitle('# Autre titre')).toThrow();
  });
});

describe('adrStatus', () => {
  it('reprend les lignes indentées qui prolongent le statut', () => {
    expect(adr.adrStatus(FIXTURE)).toBe(
      'proposé (2026-01-02). Décision pour la version locale ; la suite reste à construire.',
    );
    expect(() => adr.adrStatus('# ADR-0009 — x')).toThrow();
  });
});

describe('summary', () => {
  it('prend le premier paragraphe du contexte, sans Markdown, borné à 200', () => {
    expect(adr.summary(FIXTURE)).toBe(
      'Le texte du contexte tient sur une ligne, puis code est cité.',
    );
    expect(adr.summary('## Contexte\n\nTrois systèmes exposent un outil :\n\n- un\n')).toBe(
      'Trois systèmes exposent un outil.',
    );
    expect(adr.summary(`## Contexte\n\n${'mot '.repeat(100)}`).length).toBeLessThanOrEqual(200);
  });
});

describe('plain et clip', () => {
  it('retire le Markdown simple et coupe au dernier mot entier', () => {
    expect(adr.plain('  **a**   `b`\n c ')).toBe('a b c');
    expect(adr.clip('court', 10)).toBe('court');
    expect(adr.clip('un deux trois quatre', 12)).toBe('un deux…');
  });
});

describe('descriptionOf et isDraft', () => {
  it('préfixe le statut, borne à 160, repère la première personne', () => {
    expect(adr.descriptionOf(FIXTURE).startsWith('Statut : proposé (2026-01-02). Décision')).toBe(
      true,
    );
    expect(adr.isDraft('Nous construisons un serveur.')).toBe(true);
    expect(adr.isDraft('Le serveur est en lecture seule.')).toBe(false);
  });
});

describe('adrEntry et byId', () => {
  it('assemble l’entrée de liste et trie par identifiant', () => {
    const entry = adr.adrEntry('0009-exemple.md', FIXTURE);
    expect(entry.href).toBe('/decisions/0009/');
    expect(entry.summary).toBe('Le texte du contexte tient sur une ligne, puis code est cité.');
    const sorted = [adr.adrEntry('0002-b.md', FIXTURE), entry].sort(adr.byId);
    expect(sorted.map((item) => item.id)).toEqual(['0002', '0009']);
  });
});

describe('ADR réelles de docs/adr', () => {
  it('chaque ADR a un titre et une description de 120 à 160 caractères', () => {
    const names = readdirSync(ADR_DIR).filter((name) => name.endsWith('.md'));
    expect(names.length).toBeGreaterThan(0);
    for (const name of names) {
      const markdown = readFileSync(`${ADR_DIR}${name}`, 'utf8');
      expect(adr.adrEntry(name, markdown).title, name).toMatch(/^ADR-\d{4} — /);
      const { length } = adr.descriptionOf(markdown);
      expect(length, name).toBeGreaterThanOrEqual(120);
      expect(length, name).toBeLessThanOrEqual(160);
    }
  });
});
