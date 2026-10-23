/** Texte de /llms.txt (llmstxt.org), logique pure ; cite les `.md` et `llms-full.txt` (T14.03). */
import type { DocGroup } from '../navigation';

export interface RegistryItem {
  name: string;
  description: string;
}

export interface LlmsInput {
  groups: readonly DocGroup[];
  items: readonly RegistryItem[];
  /** Origine absolue : `https://ds.paulperigault.dev`. Une barre finale est tolérée. */
  site: string;
}

interface DocPage {
  path: string;
  title: string;
  description: string;
}

const TITLE = '# Design system @paulperigault';

const SUMMARY = [
  'Design system de paulperigault.fr : composants Astro, jetons de couleur, d’espacement et de ' +
    'typographie (`--pp-*`), accessibilité WCAG 2.2 AA.',
  'Il est destiné aux sites d’un seul auteur construits avec Astro.',
];

const DOC_PAGES: readonly DocPage[] = [
  {
    path: '/identite/',
    title: 'Identité',
    description: 'Quatre directions de couleur comparées, avec contrastes WCAG 2 calculés.',
  },
  {
    path: '/accessibilite/',
    title: 'Accessibilité',
    description: 'Choix d’accessibilité, preuves de test et état de conformité.',
  },
  {
    path: '/glossaire/',
    title: 'Glossaire',
    description: 'Définitions des termes techniques utilisés dans la documentation.',
  },
  {
    path: '/recherche/',
    title: 'Recherche',
    description: 'Recherche dans la documentation, qui demande JavaScript.',
  },
];

const AI_RULES = [
  'Utiliser les composants de ce système plutôt que de les réécrire.',
  'Styler uniquement avec les jetons `--pp-*` : aucune couleur, taille ou espacement brut.',
  'Ne pas écrire d’attribut `style` en ligne : la CSP des sites consommateurs l’ignore.',
  'Ne pas inventer de composant : seuls ceux de la section « Composants » existent.',
];

/** Retire les barres finales pour que `${origin}/chemin` ne produise jamais `//`. */
const originOf = (site: string): string => site.replace(/\/+$/, '');

const bullet = (title: string, url: string, description: string): string =>
  `- [${title}](${url}): ${description}`;

function descriptionOf(items: readonly RegistryItem[], slug: string): string {
  const item = items.find((entry) => entry.name === slug);
  if (item === undefined) throw new Error(`Composant absent du registre : « ${slug} ».`);
  return item.description;
}

/** Un lien par composant, dans l'ordre des groupes de la navigation. */
function componentLines({ groups, items }: LlmsInput, origin: string): string[] {
  return groups.flatMap((group) =>
    group.links.map((link) =>
      bullet(link.title, `${origin}/components/${link.slug}.md`, descriptionOf(items, link.slug)),
    ),
  );
}

const section = (title: string, lines: readonly string[]): string[] => [
  '',
  `## ${title}`,
  '',
  ...lines,
];

/** Texte complet de `/llms.txt`. */
export function buildLlms(input: LlmsInput): string {
  const origin = originOf(input.site);
  const lines = [
    TITLE,
    '',
    `> ${SUMMARY.join(' ')}`,
    ...section('Composants', componentLines(input, origin)),
    ...section(
      'Documentation',
      DOC_PAGES.map((page) => bullet(page.title, `${origin}${page.path}`, page.description)),
    ),
    ...section('Registre', [
      bullet(
        'Registre des composants',
        `${origin}/r/registry.json`,
        'Registre au schéma shadcn : éléments, fichiers et jetons requis.',
      ),
    ]),
    ...section('Pour les IA', [
      ...AI_RULES.map((rule) => `- ${rule}`),
      bullet(
        'Documentation complète',
        `${origin}/llms-full.txt`,
        'Toutes les pages de composants en un seul fichier.',
      ),
    ]),
  ];
  return `${lines.join('\n')}\n`;
}
