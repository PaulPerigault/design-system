// `npm run a11y:voiceover` : à lancer À LA MAIN sur macOS (ADR-0009), jamais en CI. Parcourt les
// pages de la procédure manuelle avec VoiceOver (Guidepup) et écrit docs/a11y/results-AAAA-MM-JJ.md.
// NON TESTÉ SUR macOS. Prérequis : docs/a11y/manual-checklist.md et la page de Guidepup (réglages).
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { COMMON, COMPONENTS, PAGES } from './voiceover/expectations.mjs';
import { listenAll } from './voiceover/drive.mjs';
import { evaluateCommon, evaluateComponents } from './voiceover/evaluate.mjs';
import { renderReport } from './voiceover/report.mjs';

const SETTLE_MS = 3000;
const SAFARI_INFO = '/Applications/Safari.app/Contents/Info';
const sh = (command, args) => {
  try {
    return execFileSync(command, args, { encoding: 'utf8' }).trim();
  } catch {
    return 'inconnu';
  }
};
const option = (name, fallback) =>
  process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;

if (process.platform !== 'darwin') {
  console.error('a11y:voiceover : macOS seulement (VoiceOver). Rien n’a été fait.');
  process.exit(1);
}
const { voiceOver } = await import('@guidepup/guidepup');
const tools = {
  voiceOver,
  open: async (url) => sh('open', ['-a', 'Safari', url]),
  wait: () => new Promise((done) => setTimeout(done, SETTLE_MS)),
  steps: Number(option('steps', '120')),
};
const base = option('base', 'http://localhost:4321');
const report = (page, error) => console.error(`${page} : ${error.message}`);
const spoken = await listenAll(base, PAGES, tools, report);
const date = new Date().toISOString().slice(0, 10);
const safari = sh('defaults', ['read', SAFARI_INFO, 'CFBundleShortVersionString']);
const text = renderReport({
  date,
  environment: `macOS ${sh('sw_vers', ['-productVersion'])}, Safari ${safari}, VoiceOver, Guidepup`,
  commit: sh('git', ['rev-parse', '--short', 'HEAD']),
  components: evaluateComponents(spoken, COMPONENTS),
  common: PAGES.map((page) => ({ page, points: evaluateCommon(spoken.get(page) ?? [], COMMON) })),
});
const out = option('out', `docs/a11y/results-${date}.md`);
writeFileSync(out, text);
console.log(`Rapport écrit : ${out}`);
