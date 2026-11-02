import { describe, expect, it } from 'vitest';
import { frenchTypography, NBSP, NNBSP, RULES } from './fr-typography.mjs';

const rule = (name) => RULES.find((r) => r.name === name);
const apply = (name, text) => text.replace(rule(name).re, rule(name).to);

describe('deux-points', () => {
  it('espace insécable avant « : » suivi d’une espace', () => {
    expect(frenchTypography('Auteur : Paul')).toBe(`Auteur${NBSP}: Paul`);
  });
  it('laisse le code écrit en texte', () => {
    expect(frenchTypography('prefers-reduced-motion: reduce, a :hover')).toBe(
      'prefers-reduced-motion: reduce, a :hover',
    );
  });
  it('laisse un ratio sans espace', () => {
    expect(frenchTypography('contraste 4,5:1')).toBe('contraste 4,5:1');
  });
});

describe('ponctuation double', () => {
  it('fine insécable avant « ; », « ? » et « ! »', () => {
    expect(frenchTypography('un ; deux ? trois !')).toBe(
      `un${NNBSP}; deux${NNBSP}? trois${NNBSP}!`,
    );
  });
  it('laisse « ?. », « ?? » et « != » du code écrit en texte', () => {
    expect(frenchTypography('a ?.b, a ?? b, a != b, { href? }')).toBe(
      'a ?.b, a ?? b, a != b, { href? }',
    );
  });
});

describe('pourcentage, unités et milliers', () => {
  it('fine insécable avant « % » après un chiffre', () => {
    expect(frenchTypography('47 % des cas')).toBe(`47${NNBSP}% des cas`);
  });
  it('laisse oklch(47% 0.1 270) et un « % » sans chiffre', () => {
    expect(frenchTypography('oklch(47% 0.1 270) et le signe %')).toBe(
      'oklch(47% 0.1 270) et le signe %',
    );
  });
  it('lie le nombre à son unité', () => {
    expect(frenchTypography('12,4 px, 150 ms, 55 Kio')).toBe(
      `12,4${NNBSP}px, 150${NNBSP}ms, 55${NNBSP}Kio`,
    );
  });
  it('ne lie pas un mot qui commence comme une unité', () => {
    expect(frenchTypography('3 sections, 2 s’affichent, 5 pxm')).toBe(
      '3 sections, 2 s’affichent, 5 pxm',
    );
  });
  it('groupe les milliers', () => {
    expect(frenchTypography('1 161 espaces, 7 898 liens')).toBe(
      `1${NNBSP}161 espaces, 7${NNBSP}898 liens`,
    );
  });
  it('ne groupe pas des nombres qui se suivent', () => {
    expect(frenchTypography('2026 100, 4,5 100, 12 34')).toBe('2026 100, 4,5 100, 12 34');
  });
  it('laisse un viewBox écrit en texte', () => {
    expect(frenchTypography('par exemple « 0 0 360 120 »')).toBe(
      `par exemple «${NBSP}0 0 360 120${NBSP}»`,
    );
  });
});

describe('guillemets', () => {
  it('espaces insécables dans « »', () => {
    expect(frenchTypography('« convention »')).toBe(`«${NBSP}convention${NBSP}»`);
  });
  it('traite le début et la fin d’un nœud', () => {
    expect(apply('guillemet-fermant', ' » fin')).toBe(`${NBSP}» fin`);
    expect(apply('guillemet-ouvrant', 'début « ')).toBe(`début «${NBSP}`);
  });
});

describe('apostrophe', () => {
  it('courbe entre deux lettres, y compris sous forme d’entité', () => {
    expect(frenchTypography("l'ADR d&#39;un site")).toBe('l’ADR d’un site');
  });
  it('laisse une quote ouvrante ou finale', () => {
    expect(frenchTypography("'a' et rock'")).toBe("'a' et rock'");
  });
});

describe('idempotence', () => {
  it('une deuxième passe ne change rien', () => {
    const once = frenchTypography("« Prix : 1 200 px » ; l'ADR ? 47 % !");
    expect(frenchTypography(once)).toBe(once);
  });
});
