import { parseHTML } from 'linkedom';
import { vi } from 'vitest';
import type { Deps, Scene, SceneModule } from '../src/behaviors/milestones-3d';
import { dataBlock, type MilestoneItem } from '../src/content/milestones-3d-model';

export const MILESTONES: MilestoneItem[] = [
  { id: 'alpha', label: 'Premier', status: 'achieved', href: '/a/' },
  { id: 'beta', label: 'Second', status: 'planned' },
];

/** Balisage équivalent au rendu serveur de `Milestones3D` (voir Milestones3D.test.ts). */
export function page(): Element {
  const items = MILESTONES.map(
    (m) =>
      `<li data-pp-item="${m.id}"><strong data-pp-name>${m.label}</strong>` +
      `<span class="pp-milestones__status">${m.status}</span>` +
      `${m.href ? `<a href="${m.href}">Voir</a>` : ''}</li>`,
  ).join('');
  const { document } = parseHTML(
    `<!doctype html><html><body><section data-pp-milestones><div data-pp-stage></div>` +
      `<ol data-pp-list>${items}</ol><div data-pp-panel hidden></div>` +
      `<script type="application/json" data-pp-data>${dataBlock(MILESTONES)}</script>` +
      `</section></body></html>`,
  );
  const host = document.querySelector('[data-pp-milestones]');
  if (!host) throw new Error('hôte absent');
  return host;
}

export function scene(): Scene & { destroyed: number; active: string[] } {
  const state = { destroyed: 0, active: [] as string[] };
  return {
    ...state,
    destroy: () => {
      state.destroyed += 1;
    },
    setActive: (id) => state.active.push(id),
    get destroyed() {
      return state.destroyed;
    },
    get active() {
      return state.active;
    },
  };
}

export function setup(overrides: Partial<SceneModule> = {}) {
  const handle = scene();
  const init = vi.fn((_canvas: HTMLCanvasElement, _data: unknown, _theme: unknown, options) => {
    void options;
    return Promise.resolve(handle);
  });
  const mod: SceneModule = {
    canEnhance: () => true,
    enhanceEnv: () => ({}),
    readTheme: () => ({}),
    init,
    ...overrides,
  };
  const deps: Deps = { load: () => Promise.resolve(mod), early: () => null, ready: async () => {} };
  return { handle, init, mod, deps };
}

export const optionsOf = (init: ReturnType<typeof setup>['init']) => init.mock.calls[0]?.[3];
