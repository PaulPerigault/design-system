// Hook PreToolUse des agents Kiro (trigger PreToolUse, matcher shell) : lit l'événement sur
// stdin et bloque (code non nul) toute commande interdite (lib/forbidden.mjs). Si DS_HOOK_LOG est
// défini (chemin hors du worktree, posé par le dispatcher), l'événement y est ajouté pour audit.
import { appendFileSync, readFileSync } from 'node:fs';
import { commandText, forbiddenReason } from './lib/forbidden.mjs';

const BLOCK = 2;

const raw = readFileSync(0, 'utf8');
const reason = forbiddenReason(commandText(raw));
if (process.env.DS_HOOK_LOG) {
  appendFileSync(
    process.env.DS_HOOK_LOG,
    `${JSON.stringify({ at: new Date().toISOString(), reason, raw })}\n`,
  );
}
if (reason) {
  process.stderr.write(`Commande refusée par le design system : ${reason}. Voir AGENTS.md.\n`);
  process.exit(BLOCK);
}
