import { describe, expect, it } from 'vitest';
import { addWasm, addWasmToSbom, parseCargoTree } from './sbom-wasm.mjs';

const TREE = [
  'pp-color-wasm v0.0.0 (/work/crates/pp-color-wasm)',
  'pp-color v0.0.0 (/work/crates/pp-color)',
  'wasm-bindgen v0.2.130',
  'cfg-if v1.0.5',
  'cfg-if v1.0.5 (*)',
  '',
].join('\n');
const SHA = 'a'.repeat(64);

describe('parseCargoTree', () => {
  it('lit nom et version, sans doublon', () => {
    expect(parseCargoTree(TREE).map((c) => `${c.name}@${c.version}`)).toEqual([
      'pp-color-wasm@0.0.0',
      'pp-color@0.0.0',
      'wasm-bindgen@0.2.130',
      'cfg-if@1.0.5',
    ]);
  });
});

describe('addWasm', () => {
  it('ajoute le fichier avec son SHA-256 et ses crates, sans toucher au reste', () => {
    const sbom = addWasm(
      { bomFormat: 'CycloneDX', components: [{ name: 'x' }] },
      { file: 'pp_color_wasm_bg.wasm', sha256: SHA, crates: parseCargoTree(TREE) },
    );
    expect(sbom.bomFormat).toBe('CycloneDX');
    expect(sbom.components[0]).toEqual({ name: 'x' });
    expect(sbom.components[1]).toMatchObject({
      type: 'file',
      name: 'pp_color_wasm_bg.wasm',
      hashes: [{ alg: 'SHA-256', content: SHA }],
    });
    expect(sbom.components.some((c) => c.purl === 'pkg:cargo/wasm-bindgen@0.2.130')).toBe(true);
    expect(sbom.dependencies[0].dependsOn).toContain('pkg:cargo/cfg-if@1.0.5');
  });
});

describe('addWasmToSbom', () => {
  const files = {
    'packages/color/wasm/pp_color_wasm_bg.wasm.sha256': `${SHA}  pp_color_wasm_bg.wasm
`,
    'packages/data/wasm/pp_data_wasm_bg.wasm.sha256': `${SHA}  pp_data_wasm_bg.wasm
`,
    'sbom/paulperigault-color.cdx.json': '{"components":[]}',
    'sbom/paulperigault-data.cdx.json': '{"components":[]}',
  };
  const io = (present) => {
    const written = {};
    return {
      written,
      outDir: 'sbom',
      read: (path) => files[path],
      exists: (path) => present.includes(path),
      cargo: () => TREE,
      write: (path, text) => (written[path] = text),
    };
  };

  it('laisse le SBOM inchangé sans .wasm construit', () => {
    const context = io(['sbom/paulperigault-color.cdx.json']);
    expect(addWasmToSbom(context)).toBe(false);
    expect(context.written).toEqual({});
  });

  it('réécrit le SBOM quand l’empreinte existe', () => {
    const context = io(Object.keys(files));
    expect(addWasmToSbom(context)).toBe(true);
    expect(context.written['sbom/paulperigault-color.cdx.json']).toContain(SHA);
    expect(context.written['sbom/paulperigault-data.cdx.json']).toContain('pp_data_wasm_bg.wasm');
  });

  it('n’ajoute que le .wasm construit', () => {
    const context = io([
      'packages/data/wasm/pp_data_wasm_bg.wasm.sha256',
      'sbom/paulperigault-data.cdx.json',
      'sbom/paulperigault-color.cdx.json',
    ]);
    expect(addWasmToSbom(context)).toBe(true);
    expect(Object.keys(context.written)).toEqual(['sbom/paulperigault-data.cdx.json']);
  });
});
