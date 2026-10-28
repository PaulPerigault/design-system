// Garde-fous de l'assistant déclarés dans .claude/settings.json : aucune signature d'outil, hooks
// bloquants, actions réservées au propriétaire refusées en Bash ET PowerShell. Correspondance des
// motifs selon la règle documentée de Claude Code : `*` = tout texte, ` *` final = arguments
// facultatifs.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const settings = JSON.parse(readFileSync('.claude/settings.json', 'utf8'));
const { deny } = settings.permissions;

const toRegex = (pattern) => {
  const body = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${body.endsWith(' .*') ? `${body.slice(0, -3)}(?: .*)?` : body}$`);
};
const denied = (tool, command) =>
  deny
    .filter((rule) => rule.startsWith(`${tool}(`))
    .some((rule) => toRegex(rule.slice(tool.length + 1, -1)).test(command));

const FORBIDDEN = [
  'tofu -chdir=infra apply x.tfplan',
  'terraform plan',
  'npm publish',
  'npm publish --dry-run',
  'npm -w @paulperigault/tokens publish',
  'pnpm publish',
  'npm config set registry https://example.org/',
  'npm login',
  'cat ~/.npmrc',
  'cp x ~/.claude/settings.json',
  'git push origin main',
  'git push origin HEAD:main',
  'git push --force origin main',
  'git push origin feat/x --force-with-lease',
  'git push origin +feat/x',
  'gh pr merge 3 --admin',
  'gh -R o/r pr merge 3',
  'gh pr ready 3',
  'gh api -X PATCH repos/o/r',
  'gh repo edit --default-branch main',
  'gh secret set NPM_TOKEN',
  'gh release create v1.0.0',
  'npx wrangler deploy',
];

const ALLOWED = [
  'git push -u origin chore/l0-squelette',
  'gh pr create --base main --title "chore: x"',
  'gh pr merge 3 --squash',
  'gh pr view 3',
  'gh api repos/o/r --jq .default_branch',
  'npm pack --dry-run --workspaces',
  'npm ci',
  'npm run verify',
  'kiro-cli chat --v3 --no-interactive "OK"',
];

describe('.claude/settings.json', () => {
  it('ne signe ni les commits ni les PR', () => {
    expect(settings.attribution).toEqual({ commit: '', pr: '' });
  });

  it('ne déclare aucune autorisation durable (chemins personnels : settings.local.json)', () => {
    expect(settings.permissions.allow).toBeUndefined();
    expect(settings.permissions.additionalDirectories).toBeUndefined();
  });

  it('branche les hooks de publication et de fusion sur Bash et PowerShell, bloquants', () => {
    const [entry] = settings.hooks.PreToolUse;
    expect(entry.matcher).toBe('Bash|PowerShell');
    expect(entry.hooks.map((hook) => hook.args.at(-1))).toEqual([
      '${CLAUDE_PROJECT_DIR}/tools/guards/guard-npm-publish.mjs',
      '${CLAUDE_PROJECT_DIR}/tools/guards/guard-pr-merge.mjs',
    ]);
    for (const hook of entry.hooks) expect(hook.onFailure).toBe('block');
  });

  it.each(['Bash', 'PowerShell'])('refuse en %s chaque action réservée au propriétaire', (tool) => {
    expect(FORBIDDEN.filter((command) => !denied(tool, command))).toEqual([]);
  });

  it.each(['Bash', 'PowerShell'])('laisse passer en %s les commandes de travail', (tool) => {
    expect(ALLOWED.filter((command) => denied(tool, command))).toEqual([]);
  });

  it('déclare les mêmes motifs pour Bash et PowerShell', () => {
    const patterns = (tool) =>
      deny.filter((rule) => rule.startsWith(`${tool}(`)).map((rule) => rule.slice(tool.length));
    expect(patterns('PowerShell')).toEqual(patterns('Bash'));
  });

  it('interdit d’éditer à la main le lockfile et les changelogs générés', () => {
    expect(deny).toEqual(
      expect.arrayContaining(['Edit(**/package-lock.json)', 'Edit(**/CHANGELOG.md)']),
    );
  });
});
