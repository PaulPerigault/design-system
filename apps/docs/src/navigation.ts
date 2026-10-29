/**
 * Sommaire de la documentation : source unique du menu et de la page d'accueil. L'e2e
 * `navigation.spec.ts` vérifie que chaque page construite y figure, et inversement.
 */
export interface DocLink {
  slug: string;
  title: string;
}

export interface DocGroup {
  /** Identifiant d'ancre, sans espace. */
  id: string;
  title: string;
  links: DocLink[];
}

const link = (slug: string, title: string): DocLink => ({ slug, title });

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
    links: [link('pagination', 'Pagination'), link('tabs', 'Tabs'), link('menu', 'Menu')],
  },
  {
    id: 'surcouches',
    title: 'Surcouches',
    links: [link('popover', 'Popover'), link('tooltip', 'Tooltip')],
  },
  {
    id: 'images',
    title: 'Images',
    links: [
      link('photo', 'Photo'),
      link('art-direction', 'ArtDirection'),
      link('figure', 'Figure'),
      link('scrim', 'Scrim'),
      link('avatar', 'Avatar'),
      link('project-cover', 'ProjectCover'),
      link('gallery', 'Gallery'),
      link('diagram', 'Diagram'),
    ],
  },
  {
    id: 'donnees',
    title: 'Données',
    links: [
      link('line-chart', 'LineChart'),
      link('bar-chart', 'BarChart'),
      link('area-chart', 'AreaChart'),
      link('gauge-chart', 'GaugeChart'),
    ],
  },
];

export const hrefOf = ({ slug }: DocLink): string => `/components/${slug}/`;
