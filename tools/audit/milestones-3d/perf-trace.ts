// Trace du fil principal (CDP `Tracing`) rejouée quand une tâche longue apparaît à l'init : pour
// chaque tâche de plus de 50 ms, de quoi elle est faite (mise en page forcée ou non, rappels
// d'image, composition et lecture des pixels du canvas, ramasse-miettes, attente du GPU). Sans cela
// une tâche hors des phases du paquet 3D restait inexpliquée (CI #396).
import type { CDPSession } from '@playwright/test';

export interface TraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur?: number;
  pid: number;
  tid: number;
  args?: { name?: string; data?: { functionName?: string } };
}

const CATEGORIES = [
  'devtools.timeline',
  'disabled-by-default-devtools.timeline',
  'v8',
  'blink',
  'cc',
  'gpu',
  'blink.user_timing',
];
const LONG_US = 50_000;
const MIN_PART_US = 2_000;
const US_PER_MS = 1000;
const PARTS_SHOWN = 6;
const INTERESTING =
  /ForcedStyleAndLayout|^Layout$|UpdateLayoutTree|^FunctionCall$|EvaluateScript|V8\.GC_MC|^Commit$|ReadPixels|GetProgramiv|GetGLError|GetString|PrePaint|^Paint$|NotifyResizeObservers|FireAnimationFrame|MessageEvent|TimerFire/;

/** Enregistre la trace pendant `run` et rend ses événements. */
export async function recordTrace(
  cdp: CDPSession,
  run: () => Promise<void>,
): Promise<TraceEvent[]> {
  const events: TraceEvent[] = [];
  cdp.on('Tracing.dataCollected', (chunk) => events.push(...(chunk.value as TraceEvent[])));
  const complete = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
  await cdp.send('Tracing.start', { traceConfig: { includedCategories: CATEGORIES } });
  await run();
  await cdp.send('Tracing.end');
  await complete;
  return events;
}

const label = (event: TraceEvent): string =>
  event.name === 'FunctionCall'
    ? `FunctionCall ${event.args?.data?.functionName || '?'}`
    : event.name;

const lasts = (e: TraceEvent): number => e.dur ?? 0;

/** `e` est un événement notable contenu dans `task`. */
const partOf = (task: TraceEvent, e: TraceEvent): boolean =>
  e !== task &&
  e.ts >= task.ts &&
  e.ts + lasts(e) <= task.ts + lasts(task) + 1 &&
  INTERESTING.test(e.name) &&
  lasts(e) >= MIN_PART_US;

/** Parts notables d'une tâche : durée cumulée par nom, les plus longues d'abord. */
function partsOf(task: TraceEvent, done: readonly TraceEvent[]): string {
  const parts = new Map<string, number>();
  for (const e of done.filter((candidate) => partOf(task, candidate))) {
    parts.set(label(e), (parts.get(label(e)) ?? 0) + lasts(e));
  }
  const top = [...parts].sort((a, b) => b[1] - a[1]).slice(0, PARTS_SHOWN);
  return top.map(([name, dur]) => `${name} ${Math.round(dur / US_PER_MS)}`).join(', ');
}

/** Tâches de plus de 50 ms après le début du chargement du `.wasm`, avec leurs parts principales. */
export function summarizeTrace(events: readonly TraceEvent[]): string {
  const threads = events.filter(
    (e) => e.name === 'thread_name' && e.args?.name === 'CrRendererMain',
  );
  const main = new Set(threads.map((e) => `${e.pid}:${e.tid}`));
  const done = events.filter((e) => e.ph === 'X' && main.has(`${e.pid}:${e.tid}`));
  const zero = events.find((e) => e.name === 'pp3d:load-wasm' && e.ph === 'b')?.ts ?? 0;
  const tasks = done.filter((e) => e.name === 'RunTask' && (e.dur ?? 0) > LONG_US && e.ts >= zero);
  const lines = tasks.map((task) => {
    const at = Math.round((task.ts - zero) / US_PER_MS);
    const length = Math.round((task.dur ?? 0) / US_PER_MS);
    return `+${at} ms ${length} ms : ${partsOf(task, done) || 'aucune part notable'}`;
  });
  return lines.length === 0 ? 'aucune tâche de plus de 50 ms dans la trace' : lines.join(' ; ');
}
