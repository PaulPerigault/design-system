import { describe, expect, it } from 'vitest';
import {
  nextLot,
  parseQueue,
  serializeQueue,
  statusAfterSession,
  updateLot,
} from './lead-queue.ts';

const QUEUE = `# File de ds-lead

Lots confiés par l'orchestrateur.

## L8 · statut : validé · base : main · essais : 1

Garde-fous et CLI.

## L6 · statut : à faire · base : main · essais : 0

Images et photos.

## L6b · statut : renvoyé · base : lot/L6 · essais : 2

Retours : trop long.
`;

describe('file de ds-lead', () => {
  it('lit et réécrit la file sans perte', () => {
    const queue = parseQueue(QUEUE);
    expect(queue.lots.map((lot) => [lot.id, lot.status, lot.base, lot.attempts])).toEqual([
      ['L8', 'validé', 'main', 1],
      ['L6', 'à faire', 'main', 0],
      ['L6b', 'renvoyé', 'lot/L6', 2],
    ]);
    expect(queue.lots[1].body).toBe('Images et photos.');
    expect(parseQueue(serializeQueue(queue))).toEqual(queue);
  });

  it('prend le premier lot à faire ou renvoyé avec des essais restants', () => {
    const queue = parseQueue(QUEUE);
    expect(nextLot(queue)?.id).toBe('L6');
    const done = updateLot(queue, 'L6', { status: 'prêt pour validation' });
    expect(nextLot(done)).toBeNull();
  });

  it('marque abandonné après deux essais sans « prêt »', () => {
    expect(statusAfterSession({ status: 'en cours', attempts: 1 })).toBe('à faire');
    expect(statusAfterSession({ status: 'en cours', attempts: 2 })).toBe('abandonné');
    expect(statusAfterSession({ status: 'prêt pour validation', attempts: 2 })).toBe(
      'prêt pour validation',
    );
  });
});
