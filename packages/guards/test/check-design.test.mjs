import { describe, expect, it } from 'vitest';
import { checkText, cliOptions, defaults, name, run } from '../src/check-design.mjs';
import { GuardUsageError } from '../src/lib/report.mjs';
import { fakeIo } from './fake-io.mjs';

const BAD = 'a {\n  color: #fff;\n  box-shadow: 0 0 4px var(--x);\n}\n';

describe('contrat du module', () => {
  it('expose nom, défauts et options de CLI', () => {
    expect(name).toBe('design');
    expect(defaults.roots).toEqual(['src']);
    expect(defaults.extensions).toContain('.astro');
    expect(Object.keys(cliOptions)).toEqual(
      expect.arrayContaining(['allow', 'disable', 'roots', 'extensions']),
    );
  });
});

describe('checkText', () => {
  it('donne fichier, ligne et règle', () => {
    const problems = checkText('src/a.css', BAD, {});
    expect(problems.map((p) => [p.file, p.line, p.rule])).toEqual([
      ['src/a.css', 2, 'color-literal'],
      ['src/a.css', 3, 'shadow'],
    ]);
  });

  it('allow en chaîne coupe toutes les règles du chemin', () => {
    expect(checkText('src/gen/a.css', BAD, { allow: ['src/gen'] })).toEqual([]);
  });

  it('allow en objet ne coupe que les règles citées', () => {
    const allow = [{ path: 'src/a.css', rules: ['shadow'], reason: 'ADR-0003' }];
    expect(checkText('src/a.css', BAD, { allow }).map((p) => p.rule)).toEqual(['color-literal']);
  });

  it('disable coupe une règle partout', () => {
    const rules = checkText('src/a.css', BAD, { disable: ['color-literal'] }).map((p) => p.rule);
    expect(rules).toEqual(['shadow']);
  });

  it('refuse un identifiant inconnu', () => {
    expect(() => checkText('a.css', '', { disable: ['nope'] })).toThrow(GuardUsageError);
    const allow = [{ path: 'a', rules: ['nope'] }];
    expect(() => checkText('a.css', '', { allow })).toThrow(/nope/);
    expect(() => checkText('a.css', '', { allow: [{ rules: [] }] })).toThrow(GuardUsageError);
  });
});

describe('phrases, police mono et lignes', () => {
  it('refuse les phrases FR et EN, sans tenir compte de la casse', () => {
    const rules = (file, text) => checkText(file, text, {}).map((p) => p.rule);
    expect(rules('a.md', 'Passionné par le web.')).toEqual(['generic-phrase']);
    expect(rules('a.md', 'N’hésitez pas à écrire')).toEqual(['generic-phrase']);
    expect(rules('a.astro', '<p>Cutting-Edge and seamless</p>')).toHaveLength(2);
    expect(rules('a.md', 'Contraste mesuré selon WCAG 2.2.')).toEqual([]);
  });

  it('ne vise jamais la police mono (ADR-0002)', () => {
    const css = 'code { font-family: var(--pp-font-mono), monospace; }';
    expect(checkText('a.css', css, {})).toEqual([]);
    expect(checkText('a.astro', '<code class="font-mono">x</code>', {})).toEqual([]);
  });

  it('garde des numéros de ligne justes après neutralisation des commentaires', () => {
    const text = '/* a\nb */\na {\n  color: #fff;\n}\n<!-- x -->';
    const [problem] = checkText('a.css', text, {});
    expect(problem.line).toBe(4);
    expect(problem.message).toContain('« color-literal »');
    expect(problem.message).toContain('color: #fff');
  });
});

describe('run', () => {
  it('lit les fichiers sans disque et retourne 1', () => {
    const { io, out, err } = fakeIo({
      'src/a.css': BAD,
      'src/b.md': 'Texte factuel.',
      'src/c.txt': '#fff',
    });
    expect(run({}, io)).toBe(1);
    expect(err[0]).toMatch(/^src\/a\.css:2: règle « color-literal »/);
    expect(err).toHaveLength(2);
    expect(out[0]).toBe('design : 2 problème(s) sur 2 fichiers');
  });

  it('retourne 0 quand tout est propre ou autorisé', () => {
    const { io, out } = fakeIo({ 'src/a.css': BAD });
    expect(run({ allow: ['src/a.css'] }, io)).toBe(0);
    expect(out).toEqual(['design : OK (1 fichiers)']);
  });

  it('valide les options même sans fichier', () => {
    const { io } = fakeIo({ 'src/a.css': '' });
    expect(() => run({ disable: ['x'] }, io)).toThrow(GuardUsageError);
  });
});
