import { link } from './nav-link';
import type { DocGroup } from './nav-link';

/** Groupes « Images » et « Données » du sommaire (fichier à part : limite de 120 lignes). */
export const MEDIA_GROUPS: readonly DocGroup[] = [
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
      link('sparkline', 'Sparkline'),
      link('kpi-card', 'KpiCard'),
      link('data-table', 'DataTable'),
      link('legend', 'Legend'),
    ],
  },
];
