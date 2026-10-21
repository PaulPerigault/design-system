import { describe, expect, it } from 'vitest';
import { world } from './fake-world.mjs';
import { runTask } from './run-task.mjs';

const TASK = {
  id: 'T1.01',
  title: 'Stack',
  engine: 'kiro',
  agent: 'ds-worker',
  tier: 'std',
  effort: 'medium',
  files: ['a.astro', 'a.test.ts'],
  acceptance: ['npm test'],
  depends_on: [],
  body: 'Faire Stack.',
};

describe('runTask', () => {
  it('réussit au palier demandé et écrit result.json', async () => {
    const { deps, calls } = world();
    const result = await runTask(deps, TASK);
    expect(result).toMatchObject({
      status: 'passed',
      model: 'claude-sonnet-5.5',
      filesTouched: ['a.astro'],
      outOfScope: [],
    });
    expect(calls.routing).toHaveLength(1);
    expect(Object.keys(calls.written)).toContain('/r/.agents/runs/T1.01.result.json');
  });

  it('échoue sans revue sur un fichier hors périmètre (créé et non suivi)', async () => {
    const { deps } = world({ kiro: [{ created: ['intrus.ts'] }] });
    const result = await runTask(deps, TASK);
    expect(result.status).toBe('failed');
    expect(result.failure).toMatch(/hors périmètre : intrus.ts/);
  });

  it('échoue si l’exécutant a commité', async () => {
    const { deps } = world({ kiro: [{ commit: true }] });
    expect((await runTask(deps, TASK)).failure).toMatch(/commité/);
  });

  it('escalade std → hard sur échec d’acceptation', async () => {
    const { deps, calls } = world({
      acceptance: [1, 0],
      touched: [['a.astro'], ['a.astro']],
      kiro: [{}, {}],
    });
    const result = await runTask(deps, TASK, { escalate: true });
    expect(calls.kiro.map((c) => c.model)).toEqual(['claude-sonnet-5.5', 'claude-opus-5.5']);
    expect(result).toMatchObject({ status: 'passed', tier: 'hard' });
    expect(result.attempts).toHaveLength(2);
    expect(calls.removed).toBe(1);
    expect(calls.routing[1].reason).toMatch(/escalade après : acceptation en échec/);
  });

  it('bascule vers claude quand Kiro signale un quota épuisé', async () => {
    const { deps, calls } = world({
      acceptance: [1, 0],
      touched: [[], ['a.astro']],
      kiro: [{ code: 1, stderr: 'out of credits' }, {}],
    });
    const result = await runTask(deps, TASK, { escalate: true });
    expect(calls.kiro.map((c) => c.command)).toEqual(['kiro-cli', 'claude']);
    expect(result).toMatchObject({ status: 'passed', engine: 'claude', model: 'opus' });
  });

  it('transmet un retour de revue comme échec précédent (--feedback)', async () => {
    const { deps, calls } = world();
    await runTask(deps, TASK, { feedback: 'CHANGEMENTS REQUIS : a.astro:3' });
    expect(calls.routing[0].reason).toBe('relance après revue');
  });

  it('refuse le moteur Kiro quand il est marqué indisponible', async () => {
    const { deps, calls } = world();
    deps.config = {
      ...deps.config,
      kiro: { available: false, reason: 'indisponible : crédits épuisés' },
    };
    const result = await runTask(deps, TASK);
    expect(result).toMatchObject({ status: 'blocked' });
    expect(result.failure).toMatch(/crédits épuisés/);
    expect(calls.kiro).toHaveLength(0);
  });

  it('bloque une tâche dont une dépendance n’est pas intégrée', async () => {
    const { deps, calls } = world({ log: 'feat: x\n\nTâche T0.01' });
    const result = await runTask(deps, { ...TASK, depends_on: ['T0.01', 'T0.02'] });
    expect(result).toMatchObject({ status: 'blocked' });
    expect(result.failure).toMatch(/T0.02/);
    expect(calls.kiro).toHaveLength(0);
  });
});
