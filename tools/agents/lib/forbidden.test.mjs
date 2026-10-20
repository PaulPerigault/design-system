import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { forbiddenReason } from './forbidden.mjs';

describe('forbiddenReason', () => {
  it.each([
    'git commit -m "x"',
    'git push origin develop',
    'git checkout -b x',
    'npm publish --dry-run',
    'npm install left-pad',
    'npm i -D x',
    'curl https://example.org',
    'gh pr merge 3',
    'kiro-cli chat',
    'rm -rf ../../x',
    'cat ~/.npmrc',
    'cat /Users/x/.aws/credentials',
    'echo $HOME',
  ])('refuse : %s', (command) => {
    expect(forbiddenReason(command)).not.toBeNull();
  });

  it.each([
    'npx vitest run --project astro',
    'npm run verify',
    'npm test',
    'npx prettier --write packages/astro/src/layout/Stack.astro',
    'npx eslint packages/astro',
    'git status',
    'git diff --stat',
    'node tools/checks/check-size.mjs',
    'rm packages/astro/src/tmp.ts',
  ])('admet : %s', (command) => {
    expect(forbiddenReason(command)).toBeNull();
  });
});

describe('hook lancé par Node', () => {
  const run = (event) =>
    spawnSync('node', ['tools/agents/kiro-hook.mjs'], {
      input: JSON.stringify(event),
      encoding: 'utf8',
    });

  it('bloque une commande interdite, raison sur stderr', () => {
    const result = run({ tool_name: 'shell', tool_input: { command: 'git push' } });
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/git en écriture/);
  });

  it('laisse passer une commande de travail, même avec un cwd absolu dans l’événement', () => {
    const event = { cwd: '/Users/x/dev/ds-wt/T1.01', tool_input: { command: 'npm test' } };
    expect(run(event).status).toBe(0);
  });

  it('examine tout l’événement quand l’entrée de l’outil n’a pas de clé connue', () => {
    expect(run({ session_id: 's', tool: { args: ['git', 'push'] } }).status).toBe(2);
    expect(run({ session_id: 's', command: 'git push origin x' }).status).toBe(2);
  });
});
