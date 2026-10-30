// Outils « composants » : list_components, get_component. Données en mémoire, aucune E/S.
import { closest } from '../domain/text.ts';
import type { Component, Data } from '../domain/types.ts';
import { ToolError } from '../errors.ts';
import { defineTool } from './tool.ts';
import type { Tool } from './tool.ts';

const groupsOf = (components: Component[]): string[] =>
  [...new Set(components.map((c) => c.group))].sort();

export function listComponents(
  components: Component[],
  { group }: { group?: string | undefined } = {},
) {
  const groups = groupsOf(components);
  if (group !== undefined && !groups.includes(group)) {
    throw new ToolError(
      `groupe inconnu « ${group} » ; groupes : ${groups.join(', ')}.`,
      'component.group-unknown',
    );
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

export function getComponent(components: Component[], { slug }: { slug: string }): Component {
  const found = components.find((c) => c.slug === slug);
  if (found) return found;
  const near = closest(
    slug,
    components.map((c) => c.slug),
  );
  const hint = near.length > 0 ? `proches : ${near.join(', ')}` : 'voir list_components';
  throw new ToolError(`composant inconnu « ${slug} » ; ${hint}.`, 'component.unknown');
}

export function componentTools({ components }: Pick<Data, 'components'>): Tool[] {
  return [
    defineTool({
      name: 'list_components',
      title: 'Lister les composants',
      description:
        'Liste les composants publiés du design system @paulperigault (slug, titre, groupe, ' +
        'rôle en une phrase). Filtre facultatif par groupe (layout, forms, content…).',
      run: (input) => listComponents(components, input),
    }),
    defineTool({
      name: 'get_component',
      title: 'Fiche d’un composant',
      description:
        'Fiche d’un composant par slug : rôle, quand l’utiliser et quand ne pas l’utiliser, ' +
        'propriétés, exemple Astro, garanties d’accessibilité (clavier, lecteur d’écran, ' +
        'garanti par le composant, à la charge de l’intégrateur), jetons et preuves.',
      run: (input) => getComponent(components, input),
    }),
  ];
}
