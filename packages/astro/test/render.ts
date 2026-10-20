import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import { parseHTML } from 'linkedom';

// Attributs de développement ajoutés sous Vitest par certaines versions d'Astro (régression 7.3.5).
const DEV_ATTRIBUTES = / data-astro-source-(?:file|loc)="[^"]*"/g;

type Options = { props?: Record<string, unknown>; slot?: string };

/**
 * Seul point d'entrée des tests de rendu vers la Container API d'Astro, encore expérimentale :
 * si elle change, seul ce fichier bouge. Rend le composant en HTML.
 */
export const renderComponent = async (
  component: AstroComponentFactory,
  { props = {}, slot = '' }: Options = {},
): Promise<string> => {
  const container = await AstroContainer.create();
  const html = await container.renderToString(component, { props, slots: { default: slot } });
  return html.replace(DEV_ATTRIBUTES, '');
};

/** Rend le composant puis renvoie son DOM : les tests interrogent des éléments, pas des chaînes. */
export const renderDom = async (
  component: AstroComponentFactory,
  options: Options = {},
): Promise<Document> =>
  parseHTML(`<body>${await renderComponent(component, options)}</body>`).document;
