import { describe, expect, it } from 'vitest';
import { sha256 } from '../src/lib/hash.ts';
import { nodeIo, resolveIn } from '../src/lib/io.ts';
import { fakeIo } from './fake-io.mjs';

describe('io et hash', () => {
  it('résout les chemins relatifs et absolus', () => {
    const { io } = fakeIo({});
    expect([resolveIn(io, 'a/b'), resolveIn(io, '/x/y')]).toEqual(['/projet/a/b', '/x/y']);
  });

  it('sha256 hexadécimal, fins de ligne conservées', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    expect(sha256('a\r\n')).not.toBe(sha256('a\n'));
  });
});

describe('nodeIo', () => {
  it('expose cwd et écrit sur les flux avec saut de ligne', () => {
    const outBuf = [];
    const errBuf = [];
    const io = nodeIo({
      cwd: '/projet',
      stdout: { write: (s) => outBuf.push(s) },
      stderr: { write: (s) => errBuf.push(s) },
    });
    io.out('x');
    io.err('y');
    expect([io.cwd, outBuf, errBuf]).toEqual(['/projet', ['x\n'], ['y\n']]);
  });

  it('refuse un cwd relatif', () => {
    const stream = { write: () => undefined };
    expect(() => nodeIo({ cwd: 'p', stdout: stream, stderr: stream })).toThrow(
      'chemin de travail non absolu',
    );
  });

  it('accepte un lecteur Windows et garde la lettre en résolvant', () => {
    const stream = { write: () => undefined };
    const io = nodeIo({ cwd: 'C:\\p', stdout: stream, stderr: stream });
    expect([io.cwd, resolveIn(io, 'a/../b'), resolveIn(io, 'D:/x/./y')]).toEqual([
      'C:/p',
      'C:/p/b',
      'D:/x/y',
    ]);
  });
});
