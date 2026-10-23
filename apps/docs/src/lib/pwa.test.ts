import tokens from '@paulperigault/tokens/tokens.json';
import { describe, expect, it } from 'vitest';
import { GET } from '../pages/manifest.webmanifest';
import { buildManifest } from './pwa';
import { SITE_NAME } from './site';

describe('buildManifest', () => {
  const manifest = buildManifest();

  it('renseigne les champs requis', () => {
    expect(manifest).toMatchObject({
      id: '/',
      name: SITE_NAME,
      short_name: SITE_NAME,
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
    });
  });

  it('lit les couleurs dans les jetons', () => {
    expect(manifest.theme_color).toBe(tokens.themeColor.light);
    expect(manifest.background_color).toBe(tokens.themeColor.light);
  });

  it('déclare les icônes 192, 512 et maskable 512 en PNG', () => {
    const summary = manifest.icons.map(({ src, sizes, type, purpose }) => [
      src,
      sizes,
      type,
      purpose,
    ]);
    expect(summary).toEqual([
      ['/pwa/icon-192.png', '192x192', 'image/png', 'any'],
      ['/pwa/icon-512.png', '512x512', 'image/png', 'any'],
      ['/pwa/icon-maskable-512.png', '512x512', 'image/png', 'maskable'],
    ]);
  });

  it('accepte un nom de site fourni', () => {
    const custom = buildManifest({ name: 'Autre' });
    expect([custom.name, custom.short_name]).toEqual(['Autre', 'Autre']);
  });
});

describe('endpoint manifest.webmanifest', () => {
  it('sérialise le manifeste avec le bon type MIME', async () => {
    const response = await GET({} as Parameters<typeof GET>[0]);
    expect(response.headers.get('Content-Type')).toBe('application/manifest+json');
    expect(await response.json()).toEqual(JSON.parse(JSON.stringify(buildManifest())));
  });
});
