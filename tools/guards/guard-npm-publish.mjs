// Hook PreToolUse de Claude Code (Bash et PowerShell) : toute commande qui publie un paquet
// (npm, pnpm, yarn, bun ; directement, par npx, `npm exec` ou un shell) est bloquée, `--dry-run`
// compris. Seul le workflow `release` de GitHub Actions publie. Les paquets se vérifient avec
// `npm pack --dry-run`. Prudence assumée : un message de commit qui cite la commande est bloqué
// aussi (le reformuler). Code de sortie 2 = commande bloquée, raison sur stderr.
import { readFileSync } from 'node:fs';

const BLOCK = 2;
// Un gestionnaire de paquets suivi, plus loin dans le même segment, du mot `publish`.
const PUBLISH = /\b(?:npm|pnpm|yarn|bun)\b[^;&|\n]*?(?:^|[\s:'"])publish\b/;

/**
 * @param {string} command commande complète passée à Bash ou PowerShell
 * @returns {string | null} raison du refus, ou null si la commande est admise
 */
export function publishRefusal(command) {
  if (!PUBLISH.test(command)) return null;
  return (
    'Publication npm refusée (même --dry-run) : seul le workflow release publie. ' +
    'Vérifier un paquet avec `npm pack --dry-run`.'
  );
}

/** @returns {string | null} raison du refus pour un événement de hook (JSON brut) */
export function decide(rawEvent) {
  let command;
  try {
    command = JSON.parse(rawEvent)?.tool_input?.command;
  } catch {
    return 'Événement de hook illisible : commande refusée par prudence.';
  }
  return typeof command === 'string' ? publishRefusal(command) : null;
}

if (import.meta.main) {
  const reason = decide(readFileSync(0, 'utf8'));
  if (reason) {
    process.stderr.write(`${reason}\n`);
    process.exit(BLOCK);
  }
}
