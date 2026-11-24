/**
 * Comportement de Milestones3D (opt-in, ADR-0013). Le rendu serveur est la liste complète ; ce
 * module y ajoute un parcours 3D piloté au défilement si : pas d'économie de données, section
 * proche de l'écran (`milestones-3d-gate.ts`), puis WebGL2 et appareil non faible (jugés par
 * `@paulperigault/milestones-3d`, chargé par `import()` dynamique : dépendance facultative, mais à
 * installer pour importer ce module). Mouvement réduit : pas de piste haute, navigation par étapes.
 * Tout échec ramène à la liste, sans message. CSP du consommateur : `script-src 'self'
 * 'wasm-unsafe-eval'`, `connect-src 'self'` et le .wasm servi en `application/wasm`.
 */
import type { EarlyEnv, GateEnv } from './milestones-3d-gate';
import { blockedEarly, browserGate, whenReady } from './milestones-3d-gate';
import { browserEnv } from './milestones-3d-env';
import { start } from './milestones-3d-start';
import type { Deps, SceneModule } from './milestones-3d-types';
import { collect, releaseReserve } from './milestones-3d-view';

export type { Deps, Env, Mark, Scene, SceneModule } from './milestones-3d-types';

export const HOST_SELECTOR = '[data-pp-milestones]';

/** Composants déjà pris en charge : deux appels d'`install` ne démarrent pas deux scènes. */
const started = new WeakSet<Element>();

export const defaultDeps = (win: Window & typeof globalThis = window): Deps => {
  const gate: GateEnv = browserGate(win);
  const env: EarlyEnv = { navigator: win.navigator as EarlyEnv['navigator'] };
  return {
    load: () => import('@paulperigault/milestones-3d') as Promise<SceneModule>,
    early: () => blockedEarly(env),
    ready: (host) => whenReady(host, gate),
    env: browserEnv(win),
  };
};

/** Améliore un composant : ne rejette jamais, le rendu classique reste en cas d'échec. */
export async function enhance(host: Element, deps: Deps): Promise<void> {
  const parts = collect(host);
  if (!parts || started.has(host)) return;
  if (deps.early() !== null) return releaseReserve(host);
  started.add(host);
  try {
    await deps.ready(host);
    await start(parts, await deps.load(), deps.env);
  } catch {
    // Paquet absent, bloqué par la CSP ou hors ligne : la liste reste, rien n'est affiché.
  }
  // Sans scène (WebGL2 absent, appareil faible, échec) : la liste reprend sa place.
  if (host.getAttribute('data-state') !== 'enhanced') releaseReserve(host);
}

/** Démarre chaque composant sous `root` ; renvoie le nombre de composants trouvés. */
export function install(root: ParentNode, deps: Deps = defaultDeps()): number {
  const hosts = Array.from(root.querySelectorAll(HOST_SELECTOR));
  hosts.forEach((host) => void enhance(host, deps));
  return hosts.length;
}
