// Performance mesurée dans Chromium (CPU ralenti 4 fois, 4G lente) : LCP, CLS, INP, poids transféré,
// instanciation du `.wasm`, première image, temps d'image moyen et p95, tâches longues à l'init.
// Comparaison du LCP avec le rendu classique seul (mouvement réduit), jamais de seuil sur le poids.
// Firefox et WebKit : première image, temps d'image et `.wasm` sans ralentissement.
import type { Launched } from './browser.ts';
import { at, info, row } from './model.ts';
import type { Row, Where } from './model.ts';
import { describePhases, describeTasks } from './phases.ts';
import { measure } from './perf-run.ts';
import type { Metrics } from './perf-page.ts';

const MAX_CLS = 0.1;
const LCP_TOLERANCE = 1.1;
const LCP_SLACK_MS = 100;

const ms = (value: number | null): string => (value === null ? 'n/a' : `${value.toFixed(0)} ms`);

function lcpAndLayout(where: Where, classic: Metrics, enhanced: Metrics): Row[] {
  const [a, b] = [classic.lcp, enhanced.lcp];
  const kept = a === null || b === null || b <= a * LCP_TOLERANCE + LCP_SLACK_MS;
  return [
    row(where, 'LCP non dégradé', kept, `${ms(a)} → ${ms(b)} (classique → 3D)`),
    row(
      where,
      'CLS ≤ 0,1',
      enhanced.cls <= MAX_CLS,
      `classique ${classic.cls.toFixed(3)}, 3D ${enhanced.cls.toFixed(3)}${enhanced.shifts.length > 0 ? ' : ' + enhanced.shifts.join(' ; ') : ''}`,
    ),
    info(where, 'poids transféré', `${classic.bytes} → ${enhanced.bytes} octets (classique → 3D)`),
  ];
}

function runtime(where: Where, m: Metrics, trace?: string): Row[] {
  const count = m.longTasksAtInit.length;
  return [
    info(where, 'INP (clic sur un jalon)', ms(m.inp)),
    info(where, 'instanciation du .wasm', ms(m.wasm)),
    info(where, 'phases d’init (durée)', describePhases(m.phases)),
    info(where, 'première image', ms(m.firstFrame)),
    info(where, 'première image tracée (après préchauffage)', ms(m.firstDraw)),
    info(where, 'temps d’image moyen / p95', `${ms(m.frameAvg)} / ${ms(m.frameP95)}`),
    row(
      where,
      'aucune tâche longue à l’init',
      count === 0,
      describeTasks(m.longTasksAtInit, m.phases, m.loading ?? 0) +
        (trace ? ` ; trace : ${trace}` : ''),
    ),
  ];
}

/** Firefox et WebKit : pas de CDP, donc ni ralentissement ni tâches longues ; mesures brutes. */
async function unthrottled(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'mobile, sans ralentissement');
  const m = await measure(engine, base, { classic: false, throttled: false });
  return [
    info(where, 'instanciation du .wasm', ms(m.wasm)),
    info(where, 'première image', ms(m.firstFrame)),
    info(where, 'temps d’image moyen / p95', `${ms(m.frameAvg)} / ${ms(m.frameP95)}`),
  ];
}

export async function auditPerf(engine: Launched, base: string): Promise<Row[]> {
  const where = at(engine.name, 'mobile, CPU x4, 4G lente');
  if (engine.name !== 'chromium') return unthrottled(engine, base);
  const classic = await measure(engine, base, { classic: true });
  const enhanced = await measure(engine, base, { classic: false });
  // Tâche longue : même mesure rejouée sous trace, pour dire de quoi elle est faite.
  const diagnosis =
    enhanced.longTasksAtInit.length > 0
      ? await measure(engine, base, { classic: false, traced: true })
      : null;
  return [...lcpAndLayout(where, classic, enhanced), ...runtime(where, enhanced, diagnosis?.trace)];
}
