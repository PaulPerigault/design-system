import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { decide, publishRefusal } from './guard-npm-publish.mjs';

describe('publishRefusal', () => {
  it.each([
    'npm publish',
    'npm publish --dry-run',
    'npm -w @paulperigault/tokens publish --provenance',
    'npm publish --workspaces --tag next',
    'npx npm publish',
    'npm exec -- npm publish',
    'pnpm publish',
    'yarn npm publish',
    'bun publish',
    'cd packages/tokens && npm publish',
    'bash -c "npm publish"',
    'npm run build; npm publish',
  ])('bloque : %s', (command) => {
    expect(publishRefusal(command)).toMatch(/Publication npm refusée/);
  });

  it.each([
    'npm pack --dry-run',
    'npm pack --dry-run --workspaces --json',
    'npx publint packages/tokens',
    'npm run verify',
    'npm ci',
    'git status',
    'gh pr create --title "feat: x"',
  ])('laisse passer : %s', (command) => {
    expect(publishRefusal(command)).toBeNull();
  });
});

describe('hook lancé par Node', () => {
  const run = (input) =>
    spawnSync('node', ['tools/guards/guard-npm-publish.mjs'], { input, encoding: 'utf8' });

  it('bloque (code 2) une publication, raison sur stderr', () => {
    const result = run(JSON.stringify({ tool_input: { command: 'npm publish --dry-run' } }));
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/npm pack --dry-run/);
  });

  it('laisse passer (code 0) une commande ordinaire', () => {
    expect(run(JSON.stringify({ tool_input: { command: 'npm test' } })).status).toBe(0);
  });

  it('refuse un événement illisible', () => {
    expect(decide('{pas du json')).toMatch(/illisible/);
  });
});
