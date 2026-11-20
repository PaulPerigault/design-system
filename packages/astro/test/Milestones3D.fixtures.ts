import Milestones3D from '../src/content/Milestones3D.astro';
import { renderDom } from './render';

export const MILESTONES = [
  { id: 'alpha', label: 'Premier jalon', status: 'achieved', group: 'Émetteur', date: '2025-03' },
  { id: 'beta', label: 'Second jalon', status: 'planned', date: '2026-11-30', href: '/beta/' },
];
export const GOAL = { label: 'Objectif final', href: 'https://example.org/cible' };

export const render = async (props: Record<string, unknown> = {}): Promise<Element> => {
  const document = await renderDom(Milestones3D, { props: { milestones: MILESTONES, ...props } });
  const root = document.querySelector('.pp-milestones');
  if (!root) throw new Error('racine .pp-milestones absente');
  return root;
};

export const items = (root: Element): Element[] => Array.from(root.querySelectorAll('li'));
export const many = (count: number): unknown[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `jalon-${index}`,
    label: `Jalon ${index}`,
    status: index % 2 === 0 ? 'achieved' : 'planned',
  }));
