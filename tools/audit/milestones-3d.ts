// Audit web de la scène 3D de jalons (#366, ADR-0012 et ADR-0013) : construit la documentation, la sert comme
// l'hébergeur, puis contrôle rendu, performance, robustesse, accessibilité, console et réseau sur
// Chromium, Firefox et WebKit. Sortie : tableau par moteur et par contrôle ; code non nul si un
// contrôle échoue. Usage : `task audit:milestones-3d` ou `node tools/audit/milestones-3d.ts [options]`.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { build } from './milestones-3d/build.ts';
import { auditA11y } from './milestones-3d/a11y.ts';
import { auditBadges } from './milestones-3d/badges.ts';
import { auditBroken } from './milestones-3d/broken.ts';
import { auditFraming } from './milestones-3d/framing-steps.ts';
import { launch, parseEngines } from './milestones-3d/browser.ts';
import type { Launched } from './milestones-3d/browser.ts';
import { auditLeaks } from './milestones-3d/leaks.ts';
import { auditLighthouse } from './milestones-3d/lighthouse.ts';
import { at, brief, row } from './milestones-3d/model.ts';
import type { Row } from './milestones-3d/model.ts';
import { auditNetwork } from './milestones-3d/network.ts';
import { auditPerf } from './milestones-3d/perf.ts';
import { auditReduced } from './milestones-3d/reduced.ts';
import { auditRender } from './milestones-3d/render.ts';
import { exitCode, formatTable, summary } from './milestones-3d/report.ts';
import { auditWeights } from './milestones-3d/weights.ts';
import { auditRobust } from './milestones-3d/robust.ts';
import { auditScroll } from './milestones-3d/scroll.ts';
import { serve } from './milestones-3d/server.ts';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    engines: { type: 'string' },
    out: { type: 'string' },
    'skip-build': { type: 'boolean' },
    'skip-lighthouse': { type: 'boolean' },
  },
});

/** Un contrôle qui lève (délai, navigateur fermé) devient une ligne en échec, pas un arrêt de l'audit. */
async function safely(engine: Launched, name: string, run: () => Promise<Row[]>): Promise<Row[]> {
  console.error('… ' + engine.name + ' : ' + name);
  try {
    return await run();
  } catch (error) {
    return [row(at(engine.name, name), 'contrôle exécuté', false, brief(error))];
  }
}

async function auditEngine(engine: Launched, base: string, out: string): Promise<Row[]> {
  const steps: [string, () => Promise<Row[]>][] = [
    ['rendu', () => auditRender(engine, base, out)],
    ['cadrage par étape', () => auditFraming(engine, base)],
    ['défilement', () => auditScroll(engine, base)],
    ['badges', () => auditBadges(engine, base)],
    ['image en 404', () => auditBroken(engine, base)],
    ['mouvement réduit', () => auditReduced(engine, base)],
    ['robustesse', () => auditRobust(engine, base)],
    ['fuites', () => auditLeaks(engine, base)],
    ['accessibilité', () => auditA11y(engine, base)],
    ['console et réseau', () => auditNetwork(engine, base)],
    ['performance', () => auditPerf(engine, base)],
  ];
  const rows: Row[] = [];
  for (const [name, run] of steps) rows.push(...(await safely(engine, name, run)));
  return rows;
}

async function collect(engines: Launched[], base: string, out: string): Promise<Row[]> {
  const rows: Row[] = [];
  for (const engine of engines) rows.push(...(await auditEngine(engine, base, out)));
  if (!values['skip-lighthouse']) rows.push(...(await auditLighthouse(base, out)));
  return rows;
}

/** Site audité : l'adresse donnée (aperçu), sinon la doc construite servie en local. */
async function target(): Promise<{ base: string; dist?: string; close: () => Promise<void> }> {
  if (values.url) return { base: values.url, close: async () => undefined };
  if (!values['skip-build']) build(ROOT);
  const dist = join(ROOT, 'apps/docs/dist');
  const server = await serve(dist);
  return { base: server.url, dist, close: server.close };
}

function print(rows: Row[], out: string): void {
  writeFileSync(join(out, 'rapport.json'), JSON.stringify(rows, null, 2));
  const tail = summary(rows) + ' (rapport et captures : ' + out + ')';
  console.log(['', formatTable(rows), '', tail].join('\n'));
}

async function main(): Promise<number> {
  const out = resolve(ROOT, values.out ?? 'tmp/audit-milestones-3d');
  mkdirSync(out, { recursive: true });
  const site = await target();
  const { engines, missing } = await launch(parseEngines(values.engines));
  try {
    const weights = site.dist ? auditWeights(site.dist) : [];
    const rows = [...missing, ...weights, ...(await collect(engines, site.base, out))];
    print(rows, out);
    return exitCode(rows);
  } finally {
    await Promise.all(engines.map(({ browser }) => browser.close()));
    await site.close();
  }
}

process.exitCode = await main();
