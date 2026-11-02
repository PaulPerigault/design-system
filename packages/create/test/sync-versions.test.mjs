import { describe, expect, it } from 'vitest';
import { syncVersions } from '../scripts/sync-versions-core.ts';

const current = { '@paulperigault/css': '0.0.0', astro: '7.4.1', '@paulperigault/mcp': '0.0.0' };

describe('syncVersions', () => {
  it('aligne les paquets du dépôt et laisse les autres', () => {
    const versions = { '@paulperigault/css': '0.2.0', '@paulperigault/mcp': '0.0.0' };
    const { next, changed } = syncVersions(current, (name) => versions[name]);
    expect(next).toEqual({ ...current, '@paulperigault/css': '0.2.0' });
    expect(changed).toEqual(['@paulperigault/css']);
  });
  it('ne change rien quand les versions sont déjà alignées', () => {
    const { next, changed } = syncVersions(current, () => '0.0.0');
    expect(next).toEqual(current);
    expect(changed).toEqual([]);
  });
  it('refuse un paquet introuvable plutôt que de garder une version périmée', () => {
    expect(() => syncVersions(current, () => undefined)).toThrow('introuvable');
  });
});
