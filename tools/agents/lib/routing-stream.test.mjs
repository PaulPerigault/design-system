import { describe, expect, it } from 'vitest';
import { modelFor, nextTier, tierPlan } from './routing.mjs';
import { quotaExhausted, summarizeStream } from './stream.mjs';
import models from '../models.json' with { type: 'json' };

describe('routing', () => {
  it('résout les identifiants vérifiés et escalade sans répéter un palier', () => {
    expect(modelFor(models, 'std')).toBe('claude-sonnet-5.5');
    expect(modelFor(models, 'hard')).toBe('claude-opus-5.5');
    expect(nextTier(models, 'hard')).toBeNull();
    expect(tierPlan(models, 'mech')).toEqual(['mech', 'light', 'eco', 'std', 'hard']);
    expect(tierPlan(models, 'std')).toEqual(['std', 'hard']);
  });
});

describe('stream', () => {
  const line = (event) => JSON.stringify(event);
  const update = (u) => line({ type: 'sessionUpdate', data: { sessionId: 's1', update: u } });
  const credits = (usage) =>
    update({
      sessionUpdate: 'session_info_update',
      _meta: { kiro: { promptTurnSummaries: [{ unit: 'credit', usage }] } },
    });

  it('cumule crédits et appels d’outils, lit le statut final', () => {
    const jsonl = [
      line({ type: 'runStarted', data: {} }),
      update({ sessionUpdate: 'tool_call', _meta: { kiro: { toolId: 'write' } } }),
      credits(0.5),
      credits(0.25),
      'pas du json',
      line({ type: 'runFinished', data: { status: 'success', finalText: 'Fait.' } }),
    ].join('\n');
    expect(summarizeStream(jsonl)).toMatchObject({
      status: 'success',
      finalText: 'Fait.',
      credits: 0.75,
      toolCalls: ['write'],
      sessionId: 's1',
    });
  });

  it('détecte un quota épuisé', () => {
    expect(quotaExhausted('', 'Error: monthly usage limit reached')).toBe(true);
    expect(quotaExhausted('npm warn', 'OK')).toBe(false);
  });
});
