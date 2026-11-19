/**
 * Données de la page Milestones3D : jalons de démonstration (fictifs, jamais des certifications
 * réelles) et poids mesurés du paquet 3D.
 */

export const DEMO_MILESTONES = [
  { id: 'prototype', label: 'Prototype', status: 'achieved', group: 'Produit', date: '2025-03' },
  { id: 'beta', label: 'Bêta fermée', status: 'achieved', group: 'Produit', date: '2025-07' },
  { id: 'api', label: 'API publique', status: 'achieved', group: 'Plateforme', date: '2025-11' },
  { id: 'mobile', label: 'Version mobile', status: 'achieved', group: 'Produit', date: '2026-04' },
  { id: 'export', label: 'Export des données', status: 'planned', group: 'Plateforme' },
  { id: 'v2', label: 'Version 2', status: 'planned', group: 'Produit', date: '2027-01' },
] as const;

export const DEMO_GOAL = { label: 'Ouverture au public' } as const;

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
] satisfies { date: string; tool: string; rows: WeightRow[] }[];

export interface ExtraSection {
  id: string;
  title: string;
}

/** Sections propres à cette page, insérées avant « Preuves et décisions » (sommaire compris). */
export const EXTRA_SECTIONS: readonly ExtraSection[] = [
  { id: 'chargement', title: 'Quand la 3D se charge' },
  { id: 'donnees', title: 'Fournir ses données' },
  { id: 'securite', title: 'Politique de sécurité à prévoir' },
  { id: 'poids', title: 'Poids mesuré' },
];
