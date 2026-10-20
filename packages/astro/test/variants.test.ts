import { describe, expect, expectTypeOf, it } from 'vitest';
import { variants } from '../src/lib/variants';
import type { VariantProps } from '../src/lib/variants';

const button = variants({
  base: 'pp-button',
  variants: {
    tone: { primary: 'pp-button--primary', quiet: 'pp-button--quiet' },
    size: { m: '', l: 'pp-button--l' },
  },
  defaults: { tone: 'primary', size: 'm' },
  compound: [
    { when: { tone: 'quiet', size: 'l' }, class: 'pp-button--quiet-l' },
    { when: { size: 'l' }, class: 'pp-button--any-l pp-button--l' },
  ],
});

describe('variants : comportement', () => {
  it('applique les défauts', () => {
    expect(button()).toBe('pp-button pp-button--primary');
    expect(button({})).toBe('pp-button pp-button--primary');
  });

  it('surcharge les défauts et ajoute les composées, sans doublon', () => {
    expect(button({ tone: 'quiet', size: 'l' })).toBe(
      'pp-button pp-button--quiet pp-button--l pp-button--quiet-l pp-button--any-l',
    );
  });

  it('ignore les chaînes vides et les espaces en trop', () => {
    const spaced = variants({ base: '  a   b ', variants: { x: { on: ' c ', off: '' } } });
    expect(spaced({ x: 'on' })).toBe('a b c');
    expect(spaced({ x: 'off' })).toBe('a b');
  });

  it('traite undefined comme absent', () => {
    expect(button({ tone: undefined } as never)).toBe('pp-button pp-button--primary');
  });

  it('ignore une valeur inconnue à l’exécution (prototype compris)', () => {
    for (const value of ['toString', '__proto__', 'constructor']) {
      expect(button({ tone: value } as never)).toBe('pp-button');
    }
  });

  it('ignore une composée dont when est vide', () => {
    const empty = variants({
      base: 'a',
      variants: { x: { on: 'b' } },
      compound: [{ when: {} as never, class: 'jamais' }],
    });
    expect(empty({ x: 'on' })).toBe('a b');
  });
});

describe('variants : types', () => {
  it('infère VariantProps avec clés facultatives grâce aux défauts', () => {
    expectTypeOf<VariantProps<typeof button>>().toEqualTypeOf<{
      tone?: 'primary' | 'quiet';
      size?: 'm' | 'l';
    }>();
  });

  it('rend obligatoires les clés sans défaut', () => {
    const required = variants({ variants: { x: { a: 'a', b: 'b' } } });
    expectTypeOf<VariantProps<typeof required>>().toEqualTypeOf<{ x: 'a' | 'b' }>();
    expect(required({ x: 'b' })).toBe('b');
  });

  it('refuse une valeur inconnue, une clé inconnue et class', () => {
    // @ts-expect-error valeur inconnue
    button({ tone: 'loud' });
    // @ts-expect-error clé inconnue
    button({ color: 'red' });
    // @ts-expect-error class externe non acceptée
    button({ class: 'x' });
  });

  it('refuse une composée vide ou à valeur inconnue', () => {
    variants({
      variants: { x: { on: 'b' } },
      // @ts-expect-error when est vide
      compound: [{ when: {}, class: 'c' }],
    });
    variants({
      variants: { x: { on: 'b' } },
      // @ts-expect-error valeur inconnue dans when
      compound: [{ when: { x: 'off' }, class: 'c' }],
    });
  });
});
