import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { defaultsOf, frontmatterOf } from '../scripts/props/frontmatter';
import { propsOf } from '../scripts/props/props';

const SRC = fileURLToPath(new URL('../src/', import.meta.url));
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const COMPONENTS = Object.values(manifest.exports as Record<string, string>)
  .filter((target) => target.endsWith('.astro'))
  .map((target) => target.replace('./src/', ''));

describe('frontmatter', () => {
  it('lit le script entre les deux clôtures, vide sans frontmatter', () => {
    expect(frontmatterOf('---\nconst a = 1;\n---\n<p />')).toBe('const a = 1;');
    expect(frontmatterOf('<p />')).toBe('');
  });

  it('valeurs par défaut de la déstructuration de Astro.props, renommages compris', () => {
    const script = "const { a = 'x', b: renamed = 2, c } = Astro.props;\nconst { d = 1 } = other;";
    expect(defaultsOf(script)).toEqual({ a: "'x'", b: '2' });
  });
});

describe('propsOf', () => {
  it('types résolus (alias développés), facultatifs, JSDoc et défauts', () => {
    const photo = propsOf(`${SRC}media/Photo.astro`);
    const ratio = photo.find((prop) => prop.name === 'ratio');
    expect(ratio?.type).toBe('"portrait" | "square" | "landscape" | "wide"');
    expect(ratio?.optional).toBe(true);
    expect(photo.find((prop) => prop.name === 'focal')?.fallback).toBe("'center'");
    expect(photo.find((prop) => prop.name === 'priority')?.type).toBe('boolean');
    expect(photo.find((prop) => prop.name === 'src')?.optional).toBe(false);
    expect(photo.find((prop) => prop.name === 'alt')?.description).toMatch(/Texte alternatif/);
  });

  it('composant sans Props : aucune propriété', () => {
    expect(propsOf(`${SRC}feedback/InvokerFallback.astro`)).toEqual([]);
  });

  it.each(COMPONENTS)('%s : chaque propriété a une description (doc et MCP)', (component) => {
    const missing = propsOf(`${SRC}${component}`)
      .filter((prop) => prop.description === '')
      .map((prop) => prop.name);
    expect(missing).toEqual([]);
  });
});
