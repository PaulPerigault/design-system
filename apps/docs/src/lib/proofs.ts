/** Chiffres de la page Preuves : forme, validation et mise en forme (logique pure). */

export interface Proofs {
  measuredOn: string;
  source: string;
  tests: { unit: number; e2e: number; devices: number; themes: number };
  content: { pages: number; components: number; registryItems: number; glossaryTerms: number };
  accessibility: {
    target: string;
    axeViolations: number;
    contrastPairs: number;
    contrastMinimums: Record<string, number>;
  };
  performance: {
    budgets: { lcpMs: number; inpMs: number; cls: number; scriptGzipBytes: number };
    profile: string;
    note: string;
  };
  security: {
    csp: string;
    auditSignatures: string;
    installScripts: string;
    thirdPartyAtRuntime: number;
  };
}

type Schema = 'positive' | 'count' | 'text' | 'date' | 'counts' | { [key: string]: Schema };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Les zéros réels (aucune violation, aucune ressource tierce) sont admis ; ailleurs, > 0. */
const SCHEMA: Schema = {
  measuredOn: 'date',
  source: 'text',
  tests: { unit: 'positive', e2e: 'positive', devices: 'positive', themes: 'positive' },
  content: {
    pages: 'positive',
    components: 'positive',
    registryItems: 'positive',
    glossaryTerms: 'positive',
  },
  accessibility: {
    target: 'text',
    axeViolations: 'count',
    contrastPairs: 'positive',
    contrastMinimums: 'counts',
  },
  performance: {
    budgets: { lcpMs: 'positive', inpMs: 'positive', cls: 'positive', scriptGzipBytes: 'positive' },
    profile: 'text',
    note: 'text',
  },
  security: {
    csp: 'text',
    auditSignatures: 'text',
    installScripts: 'text',
    thirdPartyAtRuntime: 'count',
  },
};

const isNumber = (value: unknown, min: number): boolean =>
  typeof value === 'number' && Number.isFinite(value) && value >= min;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isIsoDate = (value: unknown): boolean =>
  typeof value === 'string' && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value));

const isText = (value: unknown): boolean => typeof value === 'string' && value.trim() !== '';

type Leaf = [(value: unknown) => boolean, string];

const TEXT_LEAF: Leaf = [isText, 'texte non vide'];
const LEAVES: Record<string, Leaf> = {
  positive: [(value) => isNumber(value, Number.MIN_VALUE), 'nombre positif'],
  count: [(value) => isNumber(value, 0), 'nombre supérieur ou égal à 0'],
  date: [isIsoDate, 'date ISO (AAAA-MM-JJ)'],
};

function leafProblem(value: unknown, kind: string): string | null {
  const [accepts, expected] = LEAVES[kind] ?? TEXT_LEAF;
  return accepts(value) ? null : expected;
}

function problems(value: unknown, schema: Schema, path: string): string[] {
  if (schema === 'counts') {
    const ok = isRecord(value) && Object.values(value).every((n) => isNumber(n, Number.MIN_VALUE));
    return ok && Object.keys(value).length > 0 ? [] : [`${path} : répartition de nombres positifs`];
  }
  if (typeof schema === 'string') {
    const problem = leafProblem(value, schema);
    return problem === null ? [] : [`${path} : ${problem} attendu`];
  }
  if (!isRecord(value)) return [`${path} : objet attendu`];
  return Object.entries(schema).flatMap(([key, child]) =>
    problems(value[key], child, `${path}.${key}`),
  );
}

/** Valide la forme du JSON ; lève une erreur qui liste chaque champ fautif. */
export function loadProofs(raw: unknown): Proofs {
  const found = problems(raw, SCHEMA, 'proofs');
  if (found.length > 0) throw new Error(`proofs.json invalide : ${found.join(' ; ')}`);
  return raw as Proofs;
}

const FR_NUMBER = new Intl.NumberFormat('fr', { maximumFractionDigits: 20 });
const FR_DATE = new Intl.DateTimeFormat('fr', { dateStyle: 'long', timeZone: 'UTC' });

/** Nombre en français : espace fine insécable entre les milliers, virgule décimale. */
export const formatCount = (value: number): string => FR_NUMBER.format(value);

/** Date ISO (AAAA-MM-JJ) en toutes lettres, par exemple « 23 octobre 2026 ». */
export const formatDate = (iso: string): string => FR_DATE.format(new Date(`${iso}T00:00:00Z`));
