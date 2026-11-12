/**
 * Sommaire de la documentation : source unique du menu et de la page d'accueil. L'e2e
 * `navigation.spec.ts` vérifie que chaque page construite y figure, et inversement.
 */
import { link } from './nav-link';
import type { DocGroup, DocLink } from './nav-link';
import { MEDIA_GROUPS } from './navigation-media';

export type { DocGroup, DocLink };

export const GROUPS: readonly DocGroup[] = [
  {
    id: 'mise-en-page',
    title: 'Mise en page',
    links: [
      link('stack', 'Stack'),
      link('cluster', 'Cluster'),
      link('grid', 'Grid'),
      link('container', 'Container'),
      link('sidebar', 'Sidebar'),
      link('switcher', 'Switcher'),
      link('center', 'Center'),
    ],
  },
  {
    id: 'formulaires',
    title: 'Formulaires',
    links: [
      link('button', 'Button'),
      link('field', 'Field'),
      link('input', 'Input'),
      link('textarea', 'Textarea'),
      link('select', 'Select'),
      link('choice', 'Choice'),
      link('switch', 'Switch'),
      link('combobox', 'Combobox'),
    ],
  },
  {
    id: 'retour',
    title: 'Retour',
    links: [
      link('alert', 'Alert'),
      link('progress', 'Progress'),
      link('dialog', 'Dialog'),
      link('status', 'Status'),
      link('skeleton', 'Skeleton'),
      link('toast', 'Toast'),
    ],
  },
  {
    id: 'contenu',
    title: 'Contenu',
    links: [
      link('separator', 'Separator'),
      link('accordion', 'Accordion'),
      link('table', 'Table'),
      link('breadcrumb', 'Breadcrumb'),
      link('prose', 'Prose'),
      link('diff', 'Diff'),
      link('empty-state', 'EmptyState'),
      link('stat', 'Stat'),
      link('timeline', 'Timeline'),
      link('card', 'Card'),
      link('code-block', 'CodeBlock'),
    ],
  },
  {
    id: 'navigation',
    title: 'Navigation',
    links: [
      link('pagination', 'Pagination'),
      link('tabs', 'Tabs'),
      link('menu', 'Menu'),
      link('site-nav', 'SiteNav'),
      link('site-menu', 'SiteMenu'),
    ],
  },
  {
    id: 'surcouches',
    title: 'Surcouches',
    links: [link('popover', 'Popover'), link('tooltip', 'Tooltip')],
  },
  ...MEDIA_GROUPS,
];

export const hrefOf = ({ slug }: DocLink): string => `/components/${slug}/`;
