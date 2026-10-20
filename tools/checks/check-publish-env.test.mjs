import { spawnSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { publishRefusal } from './check-publish-env.mjs';

const OIDC = { ACTIONS_ID_TOKEN_REQUEST_URL: 'https://x', ACTIONS_ID_TOKEN_REQUEST_TOKEN: 't' };

describe('publishRefusal', () => {
  it('refuse hors de GitHub Actions, même avec un jeton npm local', () => {
    expect(publishRefusal({ NPM_TOKEN: 'secret' })).toMatch(/workflow release/);
  });

  it('refuse dans GitHub Actions sans jeton OIDC', () => {
    expect(publishRefusal({ GITHUB_ACTIONS: 'true' })).toMatch(/OIDC/);
  });

  it('admet GitHub Actions avec OIDC', () => {
    expect(publishRefusal({ GITHUB_ACTIONS: 'true', ...OIDC })).toBeNull();
  });

  it('le script sort en erreur quand il est lancé en local', () => {
    const env = { PATH: process.env.PATH ?? '' };
    const result = spawnSync('node', ['tools/checks/check-publish-env.mjs'], {
      env,
      encoding: 'utf8',
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Publication refusée/);
  });
});
