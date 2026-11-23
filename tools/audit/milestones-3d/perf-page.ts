// Instrumentation de la page pour `perf.ts` : observateurs, lecture des mesures, images échantillonnées.
import type { Page } from '@playwright/test';
import { initWindow } from './phases.ts';
import { mean, percentile } from './stats.ts';
import type { LongTask, Phase } from './phases.ts';

export interface Metrics {
  lcp: number | null;
  cls: number;
  shifts: string[];
  inp: number | null;
  bytes: number;
  wasm: number | null;
  firstFrame: number | null;
  frameAvg: number | null;
  frameP95: number | null;
  longTasksAtInit: LongTask[];
  phases: Phase[];
  loading: number | null;
  /** Début du chargement jusqu'à la fin du tracé de la première image réelle. */
  firstDraw: number | null;
}

interface Raw {
  lcp: number | null;
  cls: number;
  shifts: string[];
  events: number[];
  long: LongTask[];
  phases: Phase[];
  wasm: number | null;
  loading: number | null;
  enhanced: number | null;
  frame: number | null;
  frames: number[];
  bytes: number;
}

const P95 = 0.95;

const SCRIPT = `
  window.__m = { lcp: null, cls: 0, shifts: [], events: [], long: [], wasm: null, loading: null, enhanced: null, frame: null, frames: [] };
  const watch = (type, fn, extra) => { try { new PerformanceObserver((l) => l.getEntries().forEach(fn)).observe({ type, buffered: true, ...extra }); } catch {} };
  watch('largest-contentful-paint', (e) => { window.__m.lcp = e.startTime; });
  watch('layout-shift', (e) => { if (e.hadRecentInput) return; window.__m.cls += e.value; window.__m.shifts.push(e.value.toFixed(3) + '@' + Math.round(e.startTime) + ' ' + e.sources.map((s) => s.node ? s.node.nodeName + '.' + (s.node.className || '') + '[' + Math.round(s.previousRect.y) + '>' + Math.round(s.currentRect.y) + ']' : '?').join(',')); });
  watch('longtask', (e) => window.__m.long.push({ start: e.startTime, duration: e.duration }));
  watch('event', (e) => window.__m.events.push(e.duration), { durationThreshold: 16 });
  for (const fn of ['instantiate', 'instantiateStreaming']) {
    const original = WebAssembly[fn];
    WebAssembly[fn] = async function (...args) { const t = performance.now(); const r = await original.apply(this, args); window.__m.wasm = performance.now() - t; return r; };
  }
  new MutationObserver(() => {
    const host = document.querySelector('[data-milestones-demo] .pp-milestones');
    const state = host && host.getAttribute('data-state');
    if (state === 'loading' && window.__m.loading === null) window.__m.loading = performance.now();
    if (state === 'enhanced' && window.__m.enhanced === null) {
      window.__m.enhanced = performance.now();
      requestAnimationFrame(() => requestAnimationFrame(() => { window.__m.frame = performance.now(); }));
    }
  }).observe(document, { subtree: true, attributes: true });
`;

/** Pose les observateurs avant tout script de la page (appelée avant la navigation). */
export function INSTRUMENT(page: Page): void {
  void page.context().addInitScript(SCRIPT);
}

/** Durées entre images successives pendant `duration` ms ; gardées dans la page pour `readMetrics`. */
export async function frameStats(page: Page, duration: number): Promise<void> {
  await page.evaluate(
    (total) =>
      new Promise<void>((resolve) => {
        const store = (window as unknown as { __m: { frames: number[] } }).__m.frames;
        const start = performance.now();
        let last = start;
        const tick = (now: number): void => {
          store.push(now - last);
          last = now;
          if (now - start < total) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      }),
    duration,
  );
}

export async function readMetrics(page: Page): Promise<Metrics> {
  const raw = await page.evaluate((): Raw => {
    const m = (window as unknown as { __m: Omit<Raw, 'bytes' | 'phases'> }).__m;
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const phases = performance
      .getEntriesByType('measure')
      .filter((e) => e.name.startsWith('pp3d:'))
      .map((e) => ({ name: e.name.slice(5), start: e.startTime, duration: e.duration }));
    return { ...m, phases, bytes: resources.reduce((sum, e) => sum + (e.transferSize || 0), 0) };
  });
  const { end, drawn } = initWindow(raw.frame ?? raw.enhanced ?? 0, raw.phases);
  const atInit = raw.long.filter(
    (t) => raw.loading !== null && t.start >= raw.loading && t.start <= end,
  );
  return {
    lcp: raw.lcp,
    cls: raw.cls,
    shifts: raw.shifts,
    inp: raw.events.length === 0 ? null : Math.max(...raw.events),
    bytes: raw.bytes,
    wasm: raw.wasm,
    firstFrame: raw.loading !== null && raw.frame !== null ? raw.frame - raw.loading : null,
    frameAvg: mean(raw.frames),
    frameP95: percentile(raw.frames, P95),
    longTasksAtInit: atInit,
    phases: raw.phases,
    loading: raw.loading,
    firstDraw: raw.loading !== null && drawn !== null ? drawn - raw.loading : null,
  };
}
