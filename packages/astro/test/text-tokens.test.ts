import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string): string =>
  readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

const ACCENT_TEXT = [
  'content/Accordion.astro',
  'content/Breadcrumb.astro',
  'content/Prose.astro',
  'forms/button.css',
  'navigation/Pagination.astro',
  'navigation/Tabs.astro',
];

describe('jetons de texte', () => {
  it.each(ACCENT_TEXT)('%s : le texte d’accent lit --pp-color-accent-text', (file) => {
    expect(source(file)).toMatch(/color: var\(--pp-color-accent-text\)/);
    expect(source(file)).not.toMatch(/[^-]color: var\(--pp-color-accent\)/);
  });

  it('Prose lit --pp-size-prose, plus --pp-size-measure', () => {
    const css = source('content/Prose.astro');
    expect(css).toContain('max-inline-size: var(--pp-size-prose)');
    expect(css).not.toContain('--pp-size-measure');
  });
});
