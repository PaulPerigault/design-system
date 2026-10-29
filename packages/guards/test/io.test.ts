import { describe, expect, it } from 'vitest';
import { Writable } from 'node:stream';
import { nodeIo } from '../src/infrastructure/node-io.ts';
import { fakeIo } from './fake-io.ts';

describe('fakeIo', () => {
  it('déduit les dossiers et mesure les octets réels', () => {
    const { io } = fakeIo({ 'a/b.css': 'é', 'a/c/d.css': new Uint8Array([1, 2, 3]) });
    expect([io.size('a/b.css'), io.size('a/c/d.css')]).toEqual([2, 3]);
    expect(io.readText('a/b.css')).toBe('é');
    expect(io.readdir('a').map((e) => [e.name, e.isDirectory()])).toEqual([
      ['b.css', false],
      ['c', true],
    ]);
    expect(io.exists('a/c')).toBe(true);
    expect(io.exists('z')).toBe(false);
  });
});

describe('nodeIo', () => {
  it('expose le contrat et écrit message + saut de ligne', () => {
    const chunks: string[] = [];
    const write = (chunk: unknown, _enc: BufferEncoding, done: () => void): void => {
      chunks.push(String(chunk));
      done();
    };
    const sink = new Writable({ write });
    const io = nodeIo({ stdout: sink, stderr: sink });
    expect(Object.keys(io).sort()).toEqual(
      ['err', 'exists', 'out', 'readBytes', 'readText', 'readdir', 'size'].sort(),
    );
    io.out('a');
    io.err('b');
    expect(chunks).toEqual(['a\n', 'b\n']);
  });
});
