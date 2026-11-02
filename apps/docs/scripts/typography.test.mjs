import { describe, expect, it } from 'vitest';
import { run } from './typography.mjs';

const memory = (files) => ({
  dist: 'dist',
  list: () => Object.keys(files),
  read: (path) => files[path.replace(/^dist\//, '')],
  write: (path, text) => {
    files[path.replace(/^dist\//, '')] = text;
  },
  out: { write: () => undefined },
});

describe('typography.mjs', () => {
  it('réécrit les pages HTML dont le texte change, pas le code ni les autres fichiers', () => {
    const files = {
      'index.html': "<p>Auteur : l'ADR</p><code>a : b</code>",
      'a/index.html': '<p>rien à faire</p>',
      'pagefind/page.html': '<p>x : y</p>',
      'llms.txt': 'x : y',
    };
    expect(run(memory(files))).toBe(1);
    expect(files['index.html']).toBe('<p>Auteur : l’ADR</p><code>a : b</code>');
    expect(files['pagefind/page.html']).toBe('<p>x : y</p>');
    expect(files['llms.txt']).toBe('x : y');
  });
  it('ne change rien à une deuxième passe', () => {
    const files = { 'index.html': '<p>Prix : 1 200 px ?</p>' };
    run(memory(files));
    expect(run(memory(files))).toBe(0);
  });
});
