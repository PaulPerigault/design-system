import { describe, expect, it } from 'vitest';
import { normalize, summary } from './search-results';

describe('summary', () => {
  it('accorde le pluriel', () => {
    expect(summary(1, 'dialog')).toBe('1 résultat pour « dialog »');
    expect(summary(3, 'dialog')).toBe('3 résultats pour « dialog »');
  });

  it('annonce l’absence de résultat', () => {
    expect(summary(0, 'zzz')).toBe('Aucun résultat pour « zzz »');
  });

  it('échappe la requête', () => {
    expect(summary(2, '<b>"x"</b>')).toBe('2 résultats pour « &lt;b&gt;&quot;x&quot;&lt;/b&gt; »');
  });
});

describe('normalize', () => {
  it('conserve les <mark> et le texte', () => {
    const result = normalize({
      url: '/components/dialog/',
      meta: { title: 'Dialog' },
      excerpt: 'Le <mark>Dialog</mark> modal',
    });
    expect(result).toEqual({
      url: '/components/dialog/',
      title: 'Dialog',
      excerpt: 'Le <mark>Dialog</mark> modal',
    });
  });

  it('neutralise tout HTML étranger', () => {
    const { excerpt } = normalize({
      url: '/a/',
      excerpt: '<img src=x onerror=alert(1)> <mark>ok</mark><script>x</script>',
    });
    expect(excerpt).toBe(
      '&lt;img src=x onerror=alert(1)&gt; <mark>ok</mark>&lt;script&gt;x&lt;/script&gt;',
    );
  });

  it('n’échappe pas deux fois les entités déjà échappées', () => {
    expect(normalize({ url: '/a/', excerpt: 'a &amp; b &lt;i&gt;' }).excerpt).toBe(
      'a &amp; b &lt;i&gt;',
    );
  });

  it('retombe sur l’URL sans titre', () => {
    expect(normalize({ url: '/a/', meta: {}, excerpt: '' }).title).toBe('/a/');
  });
});
