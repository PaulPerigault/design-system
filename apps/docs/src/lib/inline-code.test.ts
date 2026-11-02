import { describe, expect, it } from 'vitest';
import { splitInlineCode } from './inline-code.ts';

describe('splitInlineCode', () => {
  it('laisse un texte sans backtick en un seul segment', () => {
    expect(splitInlineCode('Aucun code ici.')).toEqual([{ code: false, text: 'Aucun code ici.' }]);
  });

  it('isole chaque paire de backticks, texte avant, entre et après', () => {
    expect(splitInlineCode('Soit `polite` soit `assertive`, au choix.')).toEqual([
      { code: false, text: 'Soit ' },
      { code: true, text: 'polite' },
      { code: false, text: ' soit ' },
      { code: true, text: 'assertive' },
      { code: false, text: ', au choix.' },
    ]);
  });

  it('garde les accolades et les guillemets du code tels quels', () => {
    expect(splitInlineCode('`{ id, title, body }`')).toEqual([
      { code: true, text: '{ id, title, body }' },
    ]);
    expect(splitInlineCode('`alt=""`')).toEqual([{ code: true, text: 'alt=""' }]);
  });

  it('traite un backtick sans paire comme du texte', () => {
    expect(splitInlineCode('un ` seul')).toEqual([{ code: false, text: 'un ` seul' }]);
  });

  it('renvoie une liste vide pour une chaîne vide', () => {
    expect(splitInlineCode('')).toEqual([]);
  });
});
