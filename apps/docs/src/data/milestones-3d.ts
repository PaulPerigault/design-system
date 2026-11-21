/**
 * Données de la page Milestones3D : jalons de démonstration (fictifs, jamais des certifications
 * réelles) et poids mesurés du paquet 3D.
 */

export { DEMO_GOAL, DEMO_MILESTONES } from './milestones-3d-demo';

export interface WeightRow {
  file: string;
  raw: number;
  gzip: number;
  brotli: number;
}

/**
 * Poids en octets. Premier relevé : README du paquet (build du .wasm). Second : build du site de
 * démonstration (Vite minifie), gzip niveau 9 et brotli qualité 11 du module zlib de Node.
 */
export const WEIGHTS = [
  {
    date: '2026-11-19',
    tool: 'tools/wasm/build-milestones.ts (cargo, wasm-bindgen 0.2.130, wasm-opt -Oz de binaryen 132)',
    rows: [
      { file: '.wasm avant wasm-opt', raw: 148755, gzip: 44484, brotli: 36264 },
      { file: '.wasm livré (après wasm-opt -Oz)', raw: 70857, gzip: 32976, brotli: 28076 },
      { file: 'glue JavaScript de wasm-bindgen', raw: 23810, gzip: 5511, brotli: 4887 },
    ],
  },
  {
    date: '2026-11-20',
    tool: 'npm -w @paulperigault/docs run build, puis node:zlib sur dist/_astro',
    rows: [
      { file: 'enveloppe TypeScript (minifiée par Vite)', raw: 14402, gzip: 5951, brotli: 5414 },
      {
        file: 'comportement Astro (gate, vue, orchestration)',
        raw: 3599,
        gzip: 1629,
        brotli: 1454,
      },
    ],
  },
  {
    date: '2026-11-21',
    tool: 'README du paquet (build du .wasm après l’ADR-0013) ; npm -w @paulperigault/docs run build, puis node:zlib (gzip niveau 9, brotli qualité 11)',
    rows: [
      { file: '.wasm avant wasm-opt', raw: 176912, gzip: 51480, brotli: 41624 },
      { file: '.wasm livré (après wasm-opt -Oz)', raw: 82538, gzip: 37792, brotli: 31992 },
      { file: 'glue JavaScript de wasm-bindgen', raw: 28403, gzip: 6566, brotli: 5833 },
      {
        file: 'comportement Astro (dist/_astro, minifié par Vite)',
        raw: 11580,
        gzip: 4510,
        brotli: 4125,
      },
    ],
  },
] satisfies { date: string; tool: string; rows: WeightRow[] }[];

export interface ExtraSection {
  id: string;
  title: string;
}

/**
 * Sections propres à cette page, insérées entre « Accessibilité » et « Propriétés » (sommaire
 * compris). L'ordre est celui des composants dans l'emplacement `more` de la page.
 */
export const EXTRA_SECTIONS: readonly ExtraSection[] = [
  { id: 'pilotage', title: 'Pilotage au défilement et interactions' },
  { id: 'replis', title: 'Mouvement réduit et replis' },
  { id: 'chargement', title: 'Quand la 3D se charge' },
  { id: 'donnees', title: 'Fournir ses données' },
  { id: 'securite', title: 'Politique de sécurité à prévoir' },
  { id: 'poids', title: 'Poids mesuré' },
  { id: 'images', title: 'Images des badges' },
  { id: 'conditions-badges', title: 'Conditions d’usage des badges' },
];
