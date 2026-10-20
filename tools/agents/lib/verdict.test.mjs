import { describe, expect, it } from 'vitest';
import { verdictOf } from './verdict.mjs';

describe('verdictOf', () => {
  it.each([
    ['APPROUVÉ', 'approved'],
    ['**APPROUVÉ**\n\nRien à signaler.', 'approved'],
    ['Je vérifie maintenant les contrôles.APPROUVÉ', 'approved'],
    ['CHANGEMENTS REQUIS\n\n- a.ts:3 — …', 'changes'],
    ['APPROUVÉ sur le fond, mais CHANGEMENTS REQUIS pour le test', 'changes'],
    ['Je n’ai pas pu conclure.', 'unreadable'],
    ['', 'unreadable'],
  ])('%j → %s', (text, verdict) => {
    expect(verdictOf(text)).toBe(verdict);
  });
});
