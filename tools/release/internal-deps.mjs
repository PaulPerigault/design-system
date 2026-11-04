// Dépendances internes d'un paquet publié : elles doivent viser la version réelle du paquet voisin.
// Un paquet publié qui dépend de `0.0.0` (l'amorce vide du registre), de `*` ou de `latest`
// s'installerait avec une version sans rapport avec celle qu'on a testée.
const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
const SCOPE = '@paulperigault/';
const PLACEHOLDER = '0.0.0';
const FLOATING = new Set(['*', 'latest', 'x', '']);
const SPEC = /^([\^~]?)(\d+)\.(\d+)\.(\d+)$/;

const parse = (version) => (SPEC.exec(version) ?? []).slice(2).map(Number);

function compare(a, b) {
  return a.reduce((diff, part, index) => diff || part - b[index], 0);
}

/** @returns {boolean} la version du workspace satisfait la plage (exacte, `^` ou `~`) */
export function satisfies(spec, version) {
  const match = SPEC.exec(spec);
  const actual = parse(version);
  if (!match || actual.length === 0) return false;
  const [base, prefix] = [parse(spec), match[1]];
  if (compare(actual, base) < 0) return false;
  if (prefix === '') return compare(actual, base) === 0;
  const fixed = prefix === '~' ? 2 : base.findIndex((part) => part > 0) + 1 || 3;
  return base.slice(0, fixed).every((part, index) => part === actual[index]);
}

/** @returns {string | null} raison de refuser `spec` pour la dépendance `name` d'un paquet */
function specProblem(name, spec, workspace) {
  if (FLOATING.has(spec)) return `${name} : « ${spec} » ne désigne aucune version précise`;
  if (!workspace.has(name)) return `${name} : paquet absent du workspace`;
  const actual = workspace.get(name);
  if (spec === PLACEHOLDER && actual !== PLACEHOLDER) {
    return `${name} : ${PLACEHOLDER} est l'amorce vide du registre, le paquet est en ${actual}`;
  }
  if (!satisfies(spec, actual)) return `${name} : ${spec} ne satisfait pas la version ${actual}`;
  return null;
}

/**
 * @param {{ name: string, version: string }[]} manifests paquets publiables du workspace
 * @returns {string[]} un message par dépendance `@paulperigault/*` fautive
 */
export function internalDependencyProblems(manifests) {
  const workspace = new Map(manifests.map((m) => [m.name, m.version]));
  return manifests.flatMap((manifest) =>
    FIELDS.flatMap((field) =>
      Object.entries(manifest[field] ?? {})
        .filter(([name]) => name.startsWith(SCOPE))
        .flatMap(([name, spec]) => {
          const problem = specProblem(name, spec, workspace);
          return problem ? [`${manifest.name} (${field}) : ${problem}`] : [];
        }),
    ),
  );
}

/**
 * @param {Record<string, string>} versions `templates/versions.json` de `create`, après `prepack`
 * @param {Map<string, string>} workspace nom → version des paquets du workspace
 * @returns {string[]} un message par version de gabarit fautive
 */
export function templateVersionProblems(versions, workspace) {
  return Object.entries(versions)
    .filter(([name]) => name.startsWith(SCOPE))
    .flatMap(([name, spec]) => {
      const problem = specProblem(name, spec, workspace);
      return problem ? [`templates/versions.json : ${problem}`] : [];
    });
}
