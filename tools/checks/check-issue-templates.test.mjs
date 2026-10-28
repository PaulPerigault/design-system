import { describe, expect, it } from 'vitest';
import { configProblems, templateProblems } from './check-issue-templates.mjs';

const LABELS = new Set(['type:bogue', 'pkg:css']);
const form = (labels, options = 'css') => `name: X
description: Y
title: 'z: '
labels: [${labels}]
assignees: [P]
projects: ['P/13']
body:
  - type: dropdown
    id: paquet
    attributes:
      options: [${options}]
  - type: input
    id: lot
`;

describe('formulaires d’issue', () => {
  it('accepte un formulaire complet', () => {
    expect(templateProblems(form("'type:bogue'"), LABELS)).toEqual([]);
  });
  it('refuse un label inconnu', () => {
    expect(templateProblems(form("'type:autre'"), LABELS)).toEqual(['label inconnu : type:autre']);
  });
  it('refuse un paquet sans label et une clé manquante', () => {
    const text = form("'type:bogue'", 'css, inconnu').replace('projects:', 'x:');
    expect(templateProblems(text, LABELS)).toEqual([
      'clé « projects » manquante',
      'paquet sans label : inconnu',
    ]);
  });
  it('refuse un identifiant en double', () => {
    const text = `${form("'type:bogue'")}  - type: input\n    id: lot\n`;
    expect(templateProblems(text, LABELS)).toEqual(['identifiant en double : lot']);
  });
  it('exige que les issues vierges soient désactivées', () => {
    expect(configProblems('blank_issues_enabled: false\n')).toEqual([]);
    expect(configProblems('blank_issues_enabled: true\n')).toHaveLength(1);
  });
});
