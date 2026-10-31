import { describe, expect, it } from 'vitest';
import { digestFailure, digestLine, sha256, weigh, weightLine } from '../scripts/wasm-files.ts';

const BYTES = Uint8Array.of(0, 97, 115, 109);

describe('empreinte du .wasm', () => {
  it('SHA-256 connu (« abc »)', () => {
    const abc = new TextEncoder().encode('abc');
    expect(sha256(abc)).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('ligne au format sha256sum', () => {
    expect(digestLine(BYTES)).toBe(`${sha256(BYTES)}  pp_data_wasm_bg.wasm\n`);
  });

  it('accepte l’empreinte exacte, refuse un octet changé', () => {
    expect(digestFailure(BYTES, digestLine(BYTES))).toBeNull();
    expect(digestFailure(Uint8Array.of(1, 97, 115, 109), digestLine(BYTES))).toMatch(/SHA-256/);
  });
});

describe('poids', () => {
  it('mesure brut, gzip et brotli, et les affiche', () => {
    const weight = weigh(new Uint8Array(4096));
    expect(weight.raw).toBe(4096);
    expect(weight.gzip).toBeLessThan(weight.raw);
    expect(weightLine(weight)).toContain('4096 o (4.0 Kio)');
  });
});
