import { describe, expect, it } from 'vitest';
import { summarizeTrace } from './perf-trace.ts';
import type { TraceEvent } from './perf-trace.ts';

const thread: TraceEvent = {
  name: 'thread_name',
  ph: 'M',
  ts: 0,
  pid: 1,
  tid: 2,
  args: { name: 'CrRendererMain' },
};
const at = (
  name: string,
  ts: number,
  dur: number,
  extra: Partial<TraceEvent> = {},
): TraceEvent => ({
  name,
  ph: 'X',
  ts,
  dur,
  pid: 1,
  tid: 2,
  ...extra,
});

describe('summarizeTrace', () => {
  it('décrit la tâche longue par ses parts, relativement au chargement du .wasm', () => {
    const events: TraceEvent[] = [
      thread,
      { name: 'pp3d:load-wasm', ph: 'b', ts: 1_000_000, pid: 1, tid: 2 },
      at('RunTask', 1_600_000, 54_000),
      at('FunctionCall', 1_600_100, 20_000, { args: { data: { functionName: 'tick' } } }),
      at('Layout', 1_620_000, 17_000),
      at('Commit', 1_640_000, 1_000),
      at('RunTask', 500_000, 80_000),
    ];
    const text = summarizeTrace(events);
    expect(text).toBe('+600 ms 54 ms : FunctionCall tick 20, Layout 17');
  });

  it('dit quand aucune tâche ne dépasse 50 ms', () => {
    expect(summarizeTrace([thread, at('RunTask', 10, 1000)])).toContain('aucune tâche');
  });
});
