import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
  FEATURES,
  OPT_LEVEL,
  WasmOptError,
  optimize,
  wasmOptArgs,
  wasmOptPath,
} from './wasm-opt.ts';

const found = () => '/node_modules/binaryen/package.json';
const missing = () => {
  throw new Error('Cannot find module');
};

describe('chemin de wasm-opt', () => {
  it('pointe le script bin/wasm-opt du paquet binaryen', () => {
    expect(wasmOptPath(found).replaceAll('\\', '/')).toBe('/node_modules/binaryen/bin/wasm-opt');
  });

  it('échoue clairement quand binaryen est absent, sans sauter l’étape', () => {
    expect(() => wasmOptPath(missing)).toThrow(WasmOptError);
    expect(() => wasmOptPath(missing)).toThrow(/npm ci/);
  });
});

describe('arguments', () => {
  it('niveau -Oz, fonctionnalités de la cible, entrée puis sortie', () => {
    const args = wasmOptArgs('in.wasm', 'out.wasm');
    expect(args[0]).toBe(OPT_LEVEL);
    expect(args).toEqual(expect.arrayContaining(FEATURES.map((name) => `--enable-${name}`)));
    expect(args.slice(-3)).toEqual(['in.wasm', '-o', 'out.wasm']);
  });
});

describe('optimize', () => {
  it('lance le script avec Node puis remplace le fichier', () => {
    const run = vi.fn(() => ({ status: 0 }));
    const replace = vi.fn();
    optimize('a.wasm', { resolve: found, run, replace });
    const [command, args] = run.mock.calls[0];
    expect(command).toBe(process.execPath);
    expect(args[0].replaceAll('\\', '/')).toBe('/node_modules/binaryen/bin/wasm-opt');
    expect(args.slice(-3)).toEqual(['a.wasm', '-o', 'a.wasm.opt']);
    expect(replace).toHaveBeenCalledWith('a.wasm.opt', 'a.wasm');
  });

  it('ne remplace rien quand wasm-opt échoue', () => {
    const replace = vi.fn();
    const run = () => ({ status: 1 });
    expect(() => optimize('a.wasm', { resolve: found, run, replace })).toThrow(/code 1/);
    expect(replace).not.toHaveBeenCalled();
  });

  it('échoue aussi quand le processus ne démarre pas', () => {
    const run = () => ({ status: null, error: new Error('spawn') });
    expect(() => optimize('a.wasm', { resolve: found, run, replace: vi.fn() })).toThrow(/aucun/);
  });

  it('optimise vraiment un module WebAssembly minimal (binaryen installé)', () => {
    // Module `(module (func (export "f") (result i32) i32.const 7))`.
    const module = Buffer.from('AGFzbQEAAAABBQFgAAF/AwIBAAcFAQFmAAAKBgEEAEEHCw==', 'base64');
    const dir = mkdtempSync(join(tmpdir(), 'wasm-opt-'));
    const file = join(dir, 'm.wasm');
    try {
      writeFileSync(file, module);
      optimize(file);
      const out = readFileSync(file);
      expect(WebAssembly.validate(out)).toBe(true);
      expect(existsSync(`${file}.opt`)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
