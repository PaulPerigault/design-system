/**
 * Comportement de Milestones3D (opt-in, ADR-0012). Le rendu serveur est la liste complète ; ce
 * module y ajoute la scène 3D si : pas de mouvement réduit, pas d'économie de données, section
 * proche de l'écran (`milestones-3d-gate.ts`), puis WebGL2 et appareil non faible (jugés par
 * `@paulperigault/milestones-3d`, chargé par `import()` dynamique : dépendance facultative, mais
 * à installer pour importer ce module). Tout échec ramène à la liste, sans message à l'écran.
 * CSP du consommateur : `script-src 'self' 'wasm-unsafe-eval'`, `connect-src 'self'` et le
 * .wasm servi en `application/wasm`. Sans eux l'init échoue et la liste reste.
 */
import type { EarlyEnv, GateEnv } from './milestones-3d-gate';
import { blockedEarly, browserGate, whenReady } from './milestones-3d-gate';
import type { Deps, Scene, SceneModule } from './milestones-3d-types';
import type { Parts } from './milestones-3d-view';
import { addSelectors, collect, itemId, removeSelectors, showActive } from './milestones-3d-view';

export type { Deps, Scene, SceneModule } from './milestones-3d-types';

export const HOST_SELECTOR = '[data-pp-milestones]';

const FIRST = 0;
const STATE = 'data-state';
/** Composants déjà pris en charge : deux appels d'`install` ne démarrent pas deux scènes. */
const started = new WeakSet<Element>();

export const defaultDeps = (win: Window & typeof globalThis = window): Deps => {
  const gate: GateEnv = browserGate(win);
  const env: EarlyEnv = {
    matchMedia: (query) => win.matchMedia(query),
    navigator: win.navigator as EarlyEnv['navigator'],
  };
  return {
    load: () => import('@paulperigault/milestones-3d') as Promise<SceneModule>,
    early: () => blockedEarly(env),
    ready: (host) => whenReady(host, gate),
  };
};

function makeCanvas(host: Element): HTMLCanvasElement {
  const canvas = host.ownerDocument.createElement('canvas');
  canvas.className = 'pp-milestones__canvas';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  return canvas;
}

/** Retour au rendu classique : idempotent, sans effet si rien n'a été amélioré. */
function reverter(
  parts: Parts,
  canvas: HTMLCanvasElement,
  scene: () => Scene | undefined,
): () => void {
  let done = false;
  return (): void => {
    if (done) return;
    done = true;
    scene()?.destroy();
    removeSelectors(parts);
    canvas.remove();
    parts.host.removeAttribute(STATE);
  };
}

async function start(parts: Parts, mod: SceneModule): Promise<void> {
  const first = parts.items[FIRST];
  if (!first || !mod.canEnhance(mod.enhanceEnv(true))) return;
  const canvas = makeCanvas(parts.host);
  let scene: Scene | undefined;
  const revert = reverter(parts, canvas, () => scene);
  parts.stage.append(canvas);
  parts.host.setAttribute(STATE, 'loading');
  try {
    scene = await mod.init(canvas, parts.data, mod.readTheme(parts.host), {
      activeId: itemId(first),
      onSelect: (id) => showActive(parts, id),
      onFallback: revert,
    });
    addSelectors(parts, (id) => {
      showActive(parts, id);
      scene?.setActive(id);
    });
    showActive(parts, itemId(first));
    parts.host.setAttribute(STATE, 'enhanced');
  } catch {
    revert();
  }
}

/** Améliore un composant : ne rejette jamais, le rendu classique reste en cas d'échec. */
export async function enhance(host: Element, deps: Deps): Promise<void> {
  const parts = collect(host);
  if (!parts || started.has(host) || deps.early() !== null) return;
  started.add(host);
  try {
    await deps.ready(host);
    await start(parts, await deps.load());
  } catch {
    // Paquet absent, bloqué par la CSP ou hors ligne : la liste reste, rien n'est affiché.
  }
}

/** Démarre chaque composant sous `root` ; renvoie le nombre de composants trouvés. */
export function install(root: ParentNode, deps: Deps = defaultDeps()): number {
  const hosts = Array.from(root.querySelectorAll(HOST_SELECTOR));
  hosts.forEach((host) => void enhance(host, deps));
  return hosts.length;
}
