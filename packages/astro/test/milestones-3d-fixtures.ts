import { parseHTML } from 'linkedom';
import { vi } from 'vitest';
import type { Deps, Mark, Scene, SceneModule } from '../src/behaviors/milestones-3d';
import { fakeEnv, type FakeEnv } from './milestones-3d-fake-env';

export { fakeEnv, placeTrack, type FakeEnv } from './milestones-3d-fake-env';
import { dataBlock } from '../src/content/milestones-3d-data';
import type { MilestoneItem } from '../src/content/milestones-3d-model';

/** Événements du DOM de linkedom (les `Event` de Node n'y sont pas acceptés). */
export const { Event: DomEvent } = parseHTML('<html></html>');

export const MILESTONES: MilestoneItem[] = [
  { id: 'alpha', label: 'Premier', status: 'achieved', code: 'AAA-1', href: '/a/' },
  { id: 'beta', label: 'Second', status: 'planned' },
];
/** Étapes du parcours : les jalons puis l'objectif. */
export const STEPS = ['alpha', 'beta', '@goal'];

/** Balisage équivalent au rendu serveur de `Milestones3D` (voir Milestones3D.test.ts). */
export function page(): HTMLElement {
  const items = [...MILESTONES, { id: '@goal', label: 'Objectif', status: 'goal' }]
    .map(
      (m) =>
        `<li data-pp-item="${m.id}" data-status="${m.status}"${m.id === '@goal' ? ' data-pp-goal' : ''}>` +
        `<div><strong data-pp-name>${m.label}</strong>` +
        ('code' in m && m.code ? `<span data-pp-code>${m.code}</span>` : '') +
        `<span class="pp-milestones__status">${m.status}</span>` +
        `<a href="/v/${m.id}/">Vérifier</a></div></li>`,
    )
    .join('');
  const details = STEPS.map((id) => `<article data-pp-detail="${id}" hidden>${id}</article>`).join(
    '',
  );
  const { document } = parseHTML(
    `<!doctype html><html><body><section data-pp-milestones data-pp-previous="Précédent" ` +
      `data-pp-next="Suivant" data-pp-steps="Étapes" data-pp-progress="Étape {current} sur {total}">` +
      `<div data-pp-track><div data-pp-frame><div data-pp-stage></div>` +
      `<ol data-pp-list>${items}</ol><div data-pp-panel hidden>${details}</div></div></div>` +
      `<script type="application/json" data-pp-data>${dataBlock(MILESTONES)}</script>` +
      `</section></body></html>`,
  );
  const host = document.querySelector<HTMLElement>('[data-pp-milestones]');
  if (!host) throw new Error('hôte absent');
  return host;
}

export interface FakeScene extends Scene {
  calls: { destroyed: number; active: string[]; progress: number[]; hover: (string | null)[] };
  marks: Mark[];
}

export function scene(): FakeScene {
  const calls = {
    destroyed: 0,
    active: [] as string[],
    progress: [] as number[],
    hover: [] as (string | null)[],
  };
  const marks: Mark[] = STEPS.map((id, i) => ({
    id,
    x: 0.2 + i * 0.3,
    y: 0.5,
    scale: 0.1,
    visible: true,
  }));
  return {
    calls,
    marks,
    destroy: () => void (calls.destroyed += 1),
    setActive: (id) => void calls.active.push(id),
    setProgress: (p) => void calls.progress.push(p),
    setHover: (id) => void calls.hover.push(id),
    progressOf: (id) => STEPS.indexOf(id) / (STEPS.length - 1),
    project: () => marks,
  };
}

export function setup(overrides: Partial<SceneModule> = {}, env: FakeEnv = fakeEnv()) {
  const handle = scene();
  const init = vi.fn((_canvas: HTMLCanvasElement, _data: unknown, _theme: unknown, options) => {
    void options;
    return Promise.resolve(handle as Scene);
  });
  const mod: SceneModule = {
    canEnhance: () => true,
    enhanceEnv: () => ({}),
    readTheme: () => ({}),
    init,
    ...overrides,
  };
  const deps: Deps = {
    load: () => Promise.resolve(mod),
    early: () => null,
    ready: async () => {},
    env,
  };
  return { handle, init, mod, deps, env };
}

export const optionsOf = (init: ReturnType<typeof setup>['init']) => init.mock.calls[0]?.[3];
