import { parseHTML } from 'linkedom';
import { describe, expect, it, vi } from 'vitest';
import { ANNOUNCE_MS, copyBlock, install, textOf } from '../src/behaviors/copy';

const page = () =>
  parseHTML(`<figure><pre><code>ligne 1\nligne <span>2</span>\n</code></pre>
<button type="button" data-copy data-copied="Copié" hidden>Copier</button>
<span role="status"></span></figure>`).document;

const button = (doc: Document): HTMLElement => {
  const found = doc.querySelector<HTMLElement>('button[data-copy]');
  if (!found) throw new Error('bouton absent');
  return found;
};

describe('textOf', () => {
  it('rend le texte du pre sans balises ni saut de ligne final', () => {
    expect(textOf(page().querySelector('pre'))).toBe('ligne 1\nligne 2');
  });

  it('rend une chaîne vide sans pre ou sans contenu', () => {
    expect(textOf(null)).toBe('');
    expect(textOf({ textContent: null })).toBe('');
  });

  it('ne retire qu’un seul saut de ligne final', () => {
    expect(textOf({ textContent: 'a\n\n' })).toBe('a\n');
  });
});

describe('copyBlock', () => {
  it('copie le code puis annonce le message, effacé après le délai', async () => {
    const doc = page();
    const writeText = vi.fn(async () => undefined);
    const schedule = vi.fn();
    expect(await copyBlock(button(doc), { writeText }, schedule)).toBe(true);
    expect(writeText).toHaveBeenCalledWith('ligne 1\nligne 2');
    const status = doc.querySelector('[role="status"]');
    expect(status?.textContent).toBe('Copié');
    expect(schedule).toHaveBeenCalledWith(expect.any(Function), ANNOUNCE_MS);
    schedule.mock.calls[0]?.[0]();
    expect(status?.textContent).toBe('');
  });

  it('n’annonce rien si la copie est refusée', async () => {
    const doc = page();
    const writeText = vi.fn(async () => Promise.reject(new Error('refusé')));
    expect(await copyBlock(button(doc), { writeText }, vi.fn())).toBe(false);
    expect(doc.querySelector('[role="status"]')?.textContent).toBe('');
  });
});

describe('install', () => {
  it('laisse le bouton masqué si l’API est absente', () => {
    const doc = page();
    expect(install(doc, null)).toBe(0);
    expect(button(doc).hidden).toBe(true);
  });

  it('révèle le bouton et copie au clic', async () => {
    const doc = page();
    const writeText = vi.fn(async () => undefined);
    expect(install(doc, { writeText }, vi.fn())).toBe(1);
    expect(button(doc).hidden).toBe(false);
    button(doc).click();
    await vi.waitFor(() => expect(writeText).toHaveBeenCalledTimes(1));
    await vi.waitFor(() => expect(doc.querySelector('[role="status"]')?.textContent).toBe('Copié'));
  });

  it('ne fait rien sans bouton', () => {
    expect(install(parseHTML('<p>rien</p>').document, { writeText: vi.fn() })).toBe(0);
  });
});
