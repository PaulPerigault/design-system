import { describe, expect, it } from 'vitest';
import { cargoHome, remapFlags, reproducibleEnv } from './reproducible.ts';

describe('compilation reproductible', () => {
  it('remplace le dépôt et CARGO_HOME par des préfixes fixes', () => {
    expect(remapFlags('/Users/a/ds/', '/Users/a/.cargo')).toEqual([
      '--remap-path-prefix=/Users/a/.cargo=/cargo',
      '--remap-path-prefix=/Users/a/ds=/workspace',
    ]);
  });

  it('donne les mêmes options pour deux machines, aux préfixes près', () => {
    const local = reproducibleEnv('/Users/a/ds', { CARGO_HOME: '/Users/a/.cargo' });
    const runner = reproducibleEnv('/home/runner/work/ds', { CARGO_HOME: '/home/runner/.cargo' });
    const fixed = (flags) => flags.replaceAll(/=\/(Users|home)\/[^ ]+=/g, '=');
    expect(fixed(local.RUSTFLAGS)).toBe(fixed(runner.RUSTFLAGS));
  });

  it('conserve RUSTFLAGS et prend ~/.cargo sans CARGO_HOME', () => {
    expect(cargoHome({}, '/h')).toBe('/h/.cargo');
    const env = reproducibleEnv('/r', { RUSTFLAGS: '-C debuginfo=0', CARGO_HOME: '/c' });
    expect(env.RUSTFLAGS?.startsWith('-C debuginfo=0 --remap')).toBe(true);
  });
});
