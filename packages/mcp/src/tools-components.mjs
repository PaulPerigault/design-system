// Outils « composants » : list_components, get_component. Données en mémoire, aucune E/S.
import { ToolError } from './schemas.mjs';

const SUGGESTIONS = 3;
const MAX_DISTANCE = 3;

/** Distance d'édition de Levenshtein (deux lignes). */
export function distance(a, b) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Candidats proches de `name` (inclusion ou distance ≤ 3), les plus proches d'abord.
 * @param {string} name
 * @param {string[]} candidates
 * @returns {string[]}
 */
export function closest(name, candidates, count = SUGGESTIONS) {
  return candidates
    .map((candidate) => ({
      candidate,
      score: candidate.includes(name) || name.includes(candidate) ? 0 : distance(name, candidate),
    }))
    .filter(({ score }) => score <= MAX_DISTANCE)
    .sort((a, b) => a.score - b.score || a.candidate.localeCompare(b.candidate, 'en'))
    .slice(0, count)
    .map(({ candidate }) => candidate);
}

const groupsOf = (components) => [...new Set(components.map((c) => c.group))].sort();

export function listComponents(components, { group } = {}) {
  const groups = groupsOf(components);
  if (group !== undefined && !groups.includes(group)) {
    throw new ToolError(`groupe inconnu « ${group} » ; groupes : ${groups.join(', ')}.`);
  }
  const selected = components.filter((c) => group === undefined || c.group === group);
  return {
    count: selected.length,
    groups,
    components: selected.map(({ slug, title, group: g, summary }) => ({
      slug,
      title,
      group: g,
      summary,
    })),
  };
}

export function getComponent(components, { slug }) {
  const found = components.find((c) => c.slug === slug);
  if (found) return found;
  const near = closest(
    slug,
    components.map((c) => c.slug),
  );
  const hint = near.length > 0 ? `proches : ${near.join(', ')}` : 'voir list_components';
  throw new ToolError(`composant inconnu « ${slug} » ; ${hint}.`);
}

/** @param {{ components: object[] }} data */
export function componentTools({ components }) {
  return [
    {
      name: 'list_components',
      title: 'Lister les composants',
      description:
        'Liste les composants publiés du design system @paulperigault (slug, titre, groupe, ' +
        'rôle en une phrase). Filtre facultatif par groupe (layout, forms, content…).',
      run: (input) => listComponents(components, input),
    },
    {
      name: 'get_component',
      title: 'Fiche d’un composant',
      description:
        'Fiche d’un composant par slug : rôle, quand l’utiliser et quand ne pas l’utiliser, ' +
        'propriétés, exemple Astro, garanties d’accessibilité (clavier, lecteur d’écran, ' +
        'garanti par le composant, à la charge de l’intégrateur), jetons et preuves.',
      run: (input) => getComponent(components, input),
    },
  ];
}
