/** Données de la page architecture : paquets et contrôles de CI, chacun avec sa source. */

// Source : AGENTS.md, tableau « Paquet / Rôle / Dépend de ».
export const PACKAGES: [string, string, string][] = [
  ['@paulperigault/tokens', 'source DTCG, couleur et contraste', 'rien à l’exécution'],
  ['@paulperigault/css', 'base, reset, polices, @theme Tailwind v4', 'tokens'],
  [
    '@paulperigault/dataviz',
    'contrat Dataset, formatage fr, palettes dérivées de l’accent',
    'tokens',
  ],
  ['@paulperigault/astro', 'composants .astro, behaviors, variants()', 'css, tokens'],
  ['@paulperigault/guards', 'contrôles de taille, couleurs, couches, images', 'rien à l’exécution'],
  ['@paulperigault/create', 'CLI create, add, eject, diff', 'rien à l’exécution'],
  ['@paulperigault/mcp', 'serveur MCP stdio en lecture seule', 'tokens, guards'],
  ['apps/docs', 'documentation vivante du design system', 'tous les paquets'],
];

// Source : .github/workflows/*.yml. Chaque ligne renvoie au fichier qui l’établit.
export const CHECKS: [string, string, string][] = [
  ['Commitlint', 'Commits de la PR, puis titre et corps : Conventional Commits', 'ci.yml'],
  ['Verify', 'npm run verify : guards, lint, format, tests, build, pack', 'ci.yml'],
  ['E2E', 'Build puis Chromium : axe WCAG 2.2 AA, 1.4.12, 2.5.8, mouvement réduit', 'ci.yml'],
  ['Site', 'Site généré par la CLI, installé sur les tarballs, puis verify', 'ci.yml'],
  ['Visuel', 'Captures sur 3 projets de la matrice, références Linux versionnées', 'visual.yml'],
  ['CodeQL', 'Analyse JavaScript et TypeScript, à chaque push, PR et lundi', 'codeql.yml'],
  ['Supply chain', 'Signatures npm, scripts d’installation, audit haut, SBOM', 'supply-chain.yml'],
  ['Scorecard', 'Note OpenSSF sur main, chaque mardi ; métadonnées publiées', 'scorecard.yml'],
];
