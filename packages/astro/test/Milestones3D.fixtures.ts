import Milestones3D from '../src/content/Milestones3D.astro';
import { renderDom } from './render';

/** Déclarés dans le désordre : le composant trie par date (le dernier n'a pas de date). */
export const MILESTONES = [
  {
    id: 'gamma',
    label: 'Troisième jalon',
    status: 'planned',
    group: 'Atelier',
    date: '2026-11-30',
    code: 'XYZ-300',
    href: '/gamma/',
    description: 'Prévu fin novembre.',
  },
  {
    id: 'alpha',
    label: 'Premier jalon',
    status: 'achieved',
    group: 'Émetteur',
    date: '2025-03',
    code: 'ABC-101',
    badge: { src: '/badges/alpha.webp', width: 512, height: 512 },
    href: 'https://example.org/verifier/alpha',
    description: 'Obtenu en mars.',
  },
  { id: 'beta', label: 'Second jalon', status: 'achieved', date: '2025-09' },
  { id: 'sans-date', label: 'Sans date', status: 'planned' },
];
export const GOAL = {
  label: 'Objectif final',
  date: '2027-01',
  href: 'https://example.org/cible',
  description: 'Au bout du parcours.',
};

export const render = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(Milestones3D, { props: { milestones: MILESTONES, ...props } });
  const root = document.querySelector('.pp-milestones');
  if (!root) throw new Error('racine .pp-milestones absente');
  return root;
};

export const items = (root: Element): Element[] =>
  Array.from(root.querySelectorAll('.pp-milestones__item'));
export const ids = (root: Element): (string | null)[] =>
  items(root).map((li) => li.getAttribute('data-pp-item'));
export const many = (count: number): unknown[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `jalon-${index}`,
    label: `Jalon ${index}`,
    status: index % 2 === 0 ? 'achieved' : 'planned',
  }));
