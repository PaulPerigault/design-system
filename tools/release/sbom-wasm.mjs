// SBOM du `.wasm` de @paulperigault/color : le fichier (empreinte SHA-256) et les crates de son
// graphe de dépendances (`cargo tree`, cible wasm32, hors macros procédurales), ajoutés au
// SBOM CycloneDX du paquet. Pur : les entrées-sorties sont injectées.
const WASM_PACKAGES = [
  {
    sbom: 'paulperigault-color.cdx.json',
    dir: 'packages/color',
    stem: 'pp_color',
    crate: 'pp-color-wasm',
  },
  {
    sbom: 'paulperigault-data.cdx.json',
    dir: 'packages/data',
    stem: 'pp_data',
    crate: 'pp-data-wasm',
  },
];
const wasmName = ({ stem }) => `${stem}_wasm_bg.wasm`;
const treeArgs = ({ crate }) => [
  ...['tree', '-p', crate, '--target', 'wasm32-unknown-unknown'],
  ...['-e', 'normal,no-proc-macro', '--prefix', 'none', '--locked'],
];

/** Lignes de `cargo tree --prefix none` : `nom vX.Y.Z` (et chemin local entre parenthèses). */
export function parseCargoTree(text) {
  const crates = text
    .split('\n')
    .map((line) => /^(\S+) v(\S+)/.exec(line))
    .filter(Boolean)
    .map(([, name, version]) => ({ name, version }));
  return [...new Map(crates.map((c) => [`${c.name}@${c.version}`, c])).values()];
}

const purl = ({ name, version }) => `pkg:cargo/${name}@${version}`;

/** Ajoute le `.wasm` (fichier + empreinte) et ses crates ; le fichier dépend des crates. */
export function addWasm(sbom, { file: name, sha256, crates }) {
  const file = {
    type: 'file',
    'bom-ref': name,
    name,
    hashes: [{ alg: 'SHA-256', content: sha256 }],
  };
  const libraries = crates.map((crate) => ({
    type: 'library',
    'bom-ref': purl(crate),
    name: crate.name,
    version: crate.version,
    purl: purl(crate),
  }));
  const link = { ref: name, dependsOn: libraries.map((library) => library['bom-ref']) };
  return {
    ...sbom,
    components: [...(sbom.components ?? []), file, ...libraries],
    dependencies: [...(sbom.dependencies ?? []), link],
  };
}

/** Ajoute le `.wasm` d'un paquet à son SBOM ; faux si le `.wasm` ou le SBOM manque (inchangé). */
function addOne(wasm, { outDir, read, exists, cargo, write }) {
  const sbomPath = `${outDir}/${wasm.sbom}`;
  const digestPath = `${wasm.dir}/wasm/${wasmName(wasm)}.sha256`;
  if (!exists(digestPath) || !exists(sbomPath)) return false;
  const [sha256] = read(digestPath).split(/\s+/);
  const crates = parseCargoTree(cargo(treeArgs(wasm)));
  const sbom = addWasm(JSON.parse(read(sbomPath)), { file: wasmName(wasm), sha256, crates });
  write(
    sbomPath,
    `${JSON.stringify(sbom, null, 2)}
`,
  );
  return true;
}

/**
 * @param {{ outDir: string, read: (path: string) => string, exists: (path: string) => boolean,
 *   cargo: (args: string[]) => string, write: (path: string, text: string) => void }} io
 * @returns {boolean} vrai si au moins un `.wasm` a été ajouté (absent : SBOM inchangé)
 */
export function addWasmToSbom(io) {
  return WASM_PACKAGES.map((wasm) => addOne(wasm, io)).some(Boolean);
}
