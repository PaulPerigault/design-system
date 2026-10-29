// Commandes interdites aux exécutants Kiro, partagées par le hook PreToolUse (kiro-hook.ts) et
// les règles `permissions` des agents (.kiro/agents/*.json, vérifiées par test). Défense en
// profondeur : le contrôle de propriété du dispatcher reste la garantie finale.

export const FORBIDDEN_COMMANDS = [
  {
    pattern:
      /\bgit\s+(?:commit|push|merge|rebase|reset|checkout|switch|branch|stash|worktree|tag|remote|config)\b/,
    reason: 'git en écriture (réservé à l’orchestrateur)',
  },
  { pattern: /\b(?:npm|pnpm|yarn|bun)\b[^;&|\n]*\bpublish\b/, reason: 'publication npm' },
  {
    pattern: /\b(?:npm|pnpm|yarn)\s+(?:install|i|add|uninstall|remove|rm|update|up|link)\b/,
    reason: 'changement de dépendances',
  },
  { pattern: /\b(?:curl|wget|nc|ssh|scp|rsync|ftp)\b/, reason: 'accès réseau' },
  {
    pattern: /\b(?:gh|kiro-cli|claude|tofu|terraform|wrangler|sudo)\b/,
    reason: 'outil réservé à l’orchestrateur',
  },
  {
    pattern: /\brm\s+-[a-z]*r[a-z]*f?\b[^;&|\n]*(?:\s\/|\s~|\.\.)/,
    reason: 'suppression hors du dossier courant',
  },
  {
    pattern: /(?:^|[\s"'=])(?:~|\$HOME|\/Users\/|\/etc\/|\.\.\/\.\.)/,
    reason: 'chemin hors du worktree',
  },
  { pattern: /\.npmrc|\.env\b|\.secrets|id_rsa|\.aws|\.ssh/, reason: 'fichier sensible' },
];

// Clés de contexte de l'événement (répertoire, session…) : jamais examinées comme commande.
const CONTEXT_KEY = /cwd|dir|session|transcript|hook|event|id$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const stringsOf = (value: unknown): string[] => {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (isRecord(value)) {
    return Object.entries(value)
      .filter(([key]) => !CONTEXT_KEY.test(key))
      .flatMap(([, item]) => stringsOf(item));
  }
  return [];
};

const INPUT_KEYS = ['tool_input', 'toolInput', 'input', 'arguments'];

/**
 * Texte de la commande d'un événement de hook Kiro (format non documenté en 2.32 : on prend
 * l'entrée de l'outil si elle existe, sinon tout l'événement, sans les clés de contexte).
 * `raw` : événement JSON brut.
 */
export function commandText(raw: string): string {
  let event: unknown;
  try {
    event = JSON.parse(raw);
  } catch {
    return raw;
  }
  const key = isRecord(event) ? INPUT_KEYS.find((name) => name in event) : undefined;
  return stringsOf(key !== undefined && isRecord(event) ? event[key] : event).join('\n');
}

/** Raison du refus de la commande `text`, ou `null` si rien d'interdit n'apparaît. */
export function forbiddenReason(text: string): string | null {
  return FORBIDDEN_COMMANDS.find(({ pattern }) => pattern.test(text))?.reason ?? null;
}
