import { describe, expect, it } from 'vitest';
import { validateData } from '../src/infrastructure/data.ts';
import { docsTools } from '../src/application/tools-docs.ts';

// Trois lignes du journal (D-040, D-041, D-055) n'ont que trois colonnes.
const short = { id: 'D-040', date: 'd', decision: 'Ligne courte' };
const full = { id: 'D-021', date: 'd', decision: 'Budget INP', alternative: 'a', rollback: 'r' };
const empty = [];
const adrs = [{ id: 'ADR-0003', title: 'Serveur MCP', text: '# ADR-0003 — Serveur MCP' }];
const tool = (decisions, name) =>
  docsTools({ docs: empty, decisions }).find((t) => t.name === name);

describe('décisions du journal à trois colonnes', () => {
  const decisions = { adrs, decisions: [short, full] };
  const data = { components: empty, tokens: null, decisions, docs: empty };

  it('alternative et rollback sont optionnels à la validation', () => {
    const tokens = { themes: { light: {}, dark: {} }, base: {}, pairs: [] };
    const valid = validateData({ ...data, tokens });
    expect(valid.decisions.decisions).toEqual([short, full]);
    expect(() =>
      validateData({ ...data, tokens, decisions: { adrs, decisions: [{ id: 'D-1' }] } }),
    ).toThrow(/invalides/);
  });

  it('get_decision et la recherche ne laissent pas « undefined » dans le texte', () => {
    expect(tool(decisions, 'get_decision').run({ id: 'D-040' })).toMatchObject(short);
    const found = tool(decisions, 'get_decision').run({ query: 'courte' });
    expect(found.results.map((r) => r.id)).toEqual(['D-040']);
    expect(JSON.stringify(found)).not.toContain('undefined');
  });
});
