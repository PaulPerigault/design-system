import { describe, expect, it } from 'vitest';
import { mapText } from './html-text.mjs';

const up = (text) => text.toUpperCase();
const run = (html) => mapText(html, up);

describe('mapText : prose', () => {
  it('transforme les nœuds de texte et conserve les balises', () => {
    expect(run('<p class="a b">un <a href="/x">deux</a> trois</p>')).toBe(
      '<p class="a b">UN <a href="/x">DEUX</a> TROIS</p>',
    );
  });
  it('transforme le titre du document et laisse doctype et commentaires', () => {
    expect(run('<!doctype html><!-- note --><title>un</title>')).toBe(
      '<!doctype html><!-- note --><title>UN</title>',
    );
  });
});

describe('mapText : zones exclues', () => {
  it('laisse code, pre, kbd et samp, y compris imbriqués', () => {
    const html = '<p>a <code>b</code> <kbd>c</kbd> <samp>d</samp></p><pre><span>e</span></pre>';
    expect(run(html)).toBe(
      '<p>A <code>b</code> <kbd>c</kbd> <samp>d</samp></p><pre><span>e</span></pre>',
    );
  });
  it('laisse script et style tels quels, même avec un « < » dans le contenu', () => {
    const html = '<style>a>b{c:d}</style><script>if (a<b) x()</script><p>e</p>';
    expect(run(html)).toBe('<style>a>b{c:d}</style><script>if (a<b) x()</script><p>E</p>');
  });
  it('laisse un texte dans une autre langue que le français', () => {
    expect(run('<p>a <span lang="en">b</span> <em lang="fr-CA">c</em></p>')).toBe(
      '<p>A <span lang="en">b</span> <em lang="fr-CA">C</em></p>',
    );
  });
});

describe('mapText : SVG', () => {
  it('traite title et desc, pas le texte du dessin', () => {
    const html = '<svg><title>a</title><desc>b</desc><g><text>c</text></g></svg><p>d</p>';
    expect(run(html)).toBe(
      '<svg><title>A</title><desc>B</desc><g><text>c</text></g></svg><p>D</p>',
    );
  });
  it('ne se perd pas dans un élément à fermeture automatique', () => {
    expect(run('<svg><path d="M0 0" /><text>a</text></svg><p>b</p>')).toBe(
      '<svg><path d="M0 0" /><text>a</text></svg><p>B</p>',
    );
  });
});

describe('mapText : attributs', () => {
  it('traite aria-label, alt, title et les meta de description', () => {
    const html =
      '<img alt="a" src="b.png"><a aria-label="c" data-title="d" title="e">f</a>' +
      '<meta name="description" content="g"><meta name="viewport" content="h">';
    expect(run(html)).toBe(
      '<img alt="A" src="b.png"><a aria-label="C" data-title="d" title="E">F</a>' +
        '<meta name="description" content="G"><meta name="viewport" content="h">',
    );
  });
  it('laisse les attributs d’une balise dans du code', () => {
    expect(run('<code><a title="a">b</a></code>')).toBe('<code><a title="a">b</a></code>');
  });
});

describe('mapText : robustesse', () => {
  it('rend la même chaîne quand la fonction ne change rien', () => {
    const html = '<p>a<br>b</p><ul><li>c<li>d</ul><p>e';
    expect(mapText(html, (text) => text)).toBe(html);
  });
  it('ferme un code resté ouvert avec son parent', () => {
    expect(run('<p>a <code>b</p><p>c')).toBe('<p>A <code>b</p><p>C');
  });
});
