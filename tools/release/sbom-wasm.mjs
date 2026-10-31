// SBOM du `.wasm` de @paulperigault/color : le fichier (empreinte SHA-256) et les crates de son
// graphe de dépendances (`cargo tree`, cible wasm32, hors macros procédurales), ajoutés au
// SBOM CycloneDX du paquet. Pur : les entrées-sorties sont injectées.
const WASM_NAME = 'pp_color_wasm_bg.wasm';
const SBOM_FILE = 'paulperigault-color.cdx.json';
const DIGEST_PATH = `packages/color/wasm/${WASM_NAME}.sha256`;
const TREE_ARGS = [
  ...['tree', '-p', 'pp-color-wasm', '--target', 'wasm32-unknown-unknown'],
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
export function addWasm(sbom, { sha256, crates }) {
  const file = {
    type: 'file',
    'bom-ref': WASM_NAME,
    name: WASM_NAME,
    hashes: [{ alg: 'SHA-256', content: sha256 }],
  };
  const libraries = crates.map((crate) => ({
    type: 'library',
    'bom-ref': purl(crate),
    name: crate.name,
    version: crate.version,
    purl: purl(crate),
  }));
  const link = { ref: WASM_NAME, dependsOn: libraries.map((library) => library['bom-ref']) };
  return {
    ...sbom,
    components: [...(sbom.components ?? []), file, ...libraries],
    dependencies: [...(sbom.dependencies ?? []), link],
  };
}

/**
 * @param {{ outDir: string, read: (path: string) => string, exists: (path: string) => boolean,
 *   cargo: (args: string[]) => string, write: (path: string, text: string) => void }} io
 * @returns {boolean} vrai si le `.wasm` a été ajouté (absent : SBOM inchangé)
 */
export function addWasmToSbom({ outDir, read, exists, cargo, write }) {
  const sbomPath = `${outDir}/${SBOM_FILE}`;
  if (!exists(DIGEST_PATH) || !exists(sbomPath)) return false;
  const [sha256] = read(DIGEST_PATH).split(/\s+/);
  const crates = parseCargoTree(cargo(TREE_ARGS));
  const sbom = addWasm(JSON.parse(read(sbomPath)), { sha256, crates });
  write(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`);
  return true;
}
