import { describe, expect, it } from 'vitest';
import {
  LabelSyncError,
  describePlan,
  planCalls,
  planLabels,
  run,
  validateLabels,
} from './sync-labels.mjs';

const label = (name, color = '111111', description = '') => ({ name, color, description });

describe('planLabels', () => {
  const desired = [label('type:bogue'), label('prio:haute', 'aaaaaa', 'a'), label('pkg:css')];
  const existing = [label('bug'), label('Type:Bogue'), label('prio:haute', 'AAAAAA', 'autre')];
  const plan = planLabels(desired, existing);

  it('crée ce qui manque, sans tenir compte de la casse du nom', () => {
    expect(plan.create.map((l) => l.name)).toEqual(['pkg:css']);
  });
  it('met à jour ce dont la description ou la couleur diffère', () => {
    expect(plan.update.map((l) => l.name)).toEqual(['prio:haute']);
  });
  it('ignore la casse hexadécimale et supprime ce qui est hors du fichier', () => {
    expect(planLabels([label('a', 'ABCDEF')], [label('a', 'abcdef')]).update).toEqual([]);
    expect(plan.remove.map((l) => l.name)).toEqual(['bug']);
  });
  it('est vide quand tout est synchronisé', () => {
    expect(describePlan(planLabels(desired, desired))).toEqual([]);
  });
});

describe('planCalls', () => {
  it('encode le nom dans le chemin et traduit chaque action', () => {
    const calls = planCalls({
      create: [label('a:b', 'ffffff', 'd')],
      update: [label('c:d')],
      remove: [label('e f')],
    });
    expect(calls.map((c) => c[1])).toEqual(['POST', 'PATCH', 'DELETE']);
    expect(calls[1][2]).toBe('repos/{owner}/{repo}/labels/c%3Ad');
    expect(calls[2][2]).toBe('repos/{owner}/{repo}/labels/e%20f');
  });
});

describe('validateLabels', () => {
  it.each([
    [label('Type:Bogue')],
    [label('é')],
    [label('a', 'xyz')],
    [label('a', '111111', 'x'.repeat(101))],
  ])('refuse un label invalide', (bad) => {
    expect(() => validateLabels([bad])).toThrow(LabelSyncError);
  });
  it('refuse un doublon', () => {
    expect(() => validateLabels([label('a'), label('a')])).toThrow('double');
  });
});

describe('run', () => {
  const read = () => JSON.stringify([label('a'), label('b', '222222')]);
  const listing = `${JSON.stringify(label('b', '333333'))}\n${JSON.stringify(label('x'))}\n`;
  const setup = () => {
    const calls = [];
    const exec = (_cmd, args) => (calls.push(args), args.includes('--paginate') ? listing : '');
    return { calls, exec, log: () => {} };
  };

  it('ne modifie rien par défaut', () => {
    const { calls, ...io } = setup();
    run({ ...io, read });
    expect(calls).toHaveLength(1);
  });
  it('applique le plan avec --apply', () => {
    const { calls, ...io } = setup();
    run({ ...io, read, apply: true });
    expect(calls.slice(1).map((c) => c[2])).toEqual(['POST', 'PATCH', 'DELETE']);
  });
  it("type l'échec de gh", () => {
    const exec = () => {
      throw new Error('boum');
    };
    expect(() => run({ exec, read, log: () => {} })).toThrow(LabelSyncError);
  });
});
