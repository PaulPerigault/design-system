import { describe, expect, it, vi } from 'vitest';
import { CONTEXT_RESTORE_TIMEOUT_MS } from '../src/constants.ts';
import type { FallbackReason } from '../src/types.ts';
import { start } from './instance-setup.ts';

describe('perte et restauration du contexte', () => {
  it('perte : preventDefault, scène prévenue, repli au bout du délai', async () => {
    const reasons: FallbackReason[] = [];
    const { h } = await start({ onFallback: (r) => reasons.push(r) });
    const event = { preventDefault: vi.fn() };
    h.canvas.emit('webglcontextlost', event);
    expect(event.preventDefault).toHaveBeenCalledOnce();
    expect(h.scene.calls).toContain('lost');
    const [timer] = [...h.timers.values()];
    expect(timer?.ms).toBe(CONTEXT_RESTORE_TIMEOUT_MS);
    timer?.callback();
    expect(reasons).toEqual(['context-lost']);
    expect(h.scene.calls.slice(-2)).toEqual(['destroy', 'free']);
  });

  it('restauration à temps : minuteur annulé, ressources recréées, image demandée', async () => {
    const reasons: FallbackReason[] = [];
    const { h } = await start({ onFallback: (r) => reasons.push(r) });
    h.runFrame();
    h.canvas.emit('webglcontextlost', { preventDefault() {} });
    h.canvas.emit('webglcontextrestored');
    expect(h.timers.size).toBe(0);
    expect(h.scene.calls).toContain('restored');
    expect(h.frames.size).toBe(1);
    expect(reasons).toEqual([]);
  });

  it('restauration qui échoue : repli définitif', async () => {
    const reasons: FallbackReason[] = [];
    const { h } = await start({ onFallback: (r) => reasons.push(r) });
    h.canvas.emit('webglcontextlost', { preventDefault() {} });
    h.scene.failNext = 'gl-resource';
    h.canvas.emit('webglcontextrestored');
    expect(reasons).toEqual(['context-lost']);
  });
});
