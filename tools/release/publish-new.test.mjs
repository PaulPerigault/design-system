import { describe, expect, it } from 'vitest';
import { distTag, toPublish } from './publish-new.mjs';

describe('publish-new', () => {
  it('publie une préversion sous next, jamais latest', () => {
    expect(distTag('0.1.0-next.1')).toBe('next');
    expect(distTag('1.2.0')).toBe('latest');
  });

  it('ne retient que les paquets publics absents du registre', () => {
    const manifests = [
      { dir: 'a', manifest: { name: '@p/a', version: '0.1.0' } },
      { dir: 'b', manifest: { name: '@p/b', version: '0.1.0' } },
      { dir: 'c', manifest: { name: '@p/c', version: '0.1.0', private: true } },
    ];
    const published = (name) => name === '@p/b';
    expect(toPublish(manifests, published).map(({ dir }) => dir)).toEqual(['a']);
  });
});
