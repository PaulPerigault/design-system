import { describe, expect, it } from 'vitest';
import { platformFlags } from './lighthouse.ts';

describe('platformFlags', () => {
  it('Linux : sans bac à sable, mémoire partagée évitée (Chrome refuse sinon de démarrer en CI)', () => {
    expect(platformFlags('linux')).toEqual(['--no-sandbox', '--disable-dev-shm-usage']);
  });

  it('macOS et Windows : aucune option ajoutée', () => {
    expect(platformFlags('darwin')).toEqual([]);
    expect(platformFlags('win32')).toEqual([]);
  });
});
