import { describe, expect, it } from 'vitest';
import { batchTable, mapLimit, readyTasks, tasksOfLot } from './batch.ts';
import { executorEnv } from './env.ts';
import { kiroArgs, transportFailure } from './transports.mjs';

describe('transports et environnement', () => {
  it('n’utilise jamais --trust-all-tools ni --sandbox', () => {
    const args = kiroArgs({
      agent: 'ds-worker',
      model: 'm',
      effort: 'low',
      trustTools: ['read'],
      prompt: 'p',
    });
    expect(args).toContain('--trust-tools=read');
    expect(args.join(' ')).not.toMatch(/trust-all-tools|--sandbox/);
    expect(args.at(-1)).toBe('p');
  });

  it('qualifie les échecs de transport', () => {
    const ok = { status: 'success' };
    expect(transportFailure({ code: 4, timedOut: false, summary: ok })).toMatch(
      /agent introuvable/,
    );
    expect(transportFailure({ code: 0, timedOut: true, summary: ok })).toMatch(/délai/);
    expect(transportFailure({ code: 0, timedOut: false, summary: ok })).toBeNull();
  });

  it('ne transmet aucun secret et neutralise la config npm de l’utilisateur', () => {
    const env = executorEnv(
      {
        PATH: '/bin',
        HOME: '/h',
        GITHUB_TOKEN: 'x',
        NPM_TOKEN: 'y',
        AWS_PROFILE: 'p',
        npm_config_registry: 'https://nexus',
        MY_API_KEY: 'k',
      },
      { emptyNpmrc: '/r/empty.npmrc', hookLog: '/r/h.jsonl' },
    );
    expect(env).toEqual({
      PATH: '/bin',
      HOME: '/h',
      npm_config_userconfig: '/r/empty.npmrc',
      npm_config_update_notifier: 'false',
      DS_HOOK_LOG: '/r/h.jsonl',
    });
  });
});

describe('batch', () => {
  const t = (id, depends_on = []) => ({ id, depends_on });

  it('retient le lot et les tâches prêtes', () => {
    const all = [t('T3.02', ['T3.01']), t('T3.01'), t('T2.01'), t('T3.10', ['T1.01'])];
    const lot = tasksOfLot(all, 'L3');
    expect(lot.map((task) => task.id)).toEqual(['T3.01', 'T3.02', 'T3.10']);
    const { ready, waiting } = readyTasks(lot, ['T1.01']);
    expect(ready.map((task) => task.id)).toEqual(['T3.01', 'T3.10']);
    expect(batchTable([], waiting)).toMatch(/T3.02 \| en attente/);
  });

  it('mapLimit respecte la limite et l’ordre', async () => {
    let running = 0;
    let peak = 0;
    const out = await mapLimit([3, 1, 2, 4], 2, async (n) => {
      running += 1;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, n));
      running -= 1;
      return n * 10;
    });
    expect(out).toEqual([30, 10, 20, 40]);
    expect(peak).toBe(2);
  });
});
