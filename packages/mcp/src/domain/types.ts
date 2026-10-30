// Types du domaine : les quatre jeux de données embarqués et les thèmes. Aucune dépendance ;
// l'infrastructure les valide (zod) à la frontière avant qu'ils n'atteignent le domaine.

export type Theme = 'light' | 'dark';

export interface ColorValue {
  oklch: string;
  hex: string;
}

export interface A11y {
  keyboard: string[];
  screenReader: string[];
  guaranteed: string[];
  integrator: string[];
}

export interface Prop {
  name: string;
  type: string;
  fallback: string;
  description: string;
}

export interface Component {
  slug: string;
  title: string;
  group: string;
  summary: string;
  use: string[];
  avoid: string[];
  snippet: string;
  a11y: A11y;
  props: Prop[];
  tokens: string[];
  evidence: string[];
}

export interface TokenPair {
  fg: string;
  bg: string;
  min: number;
  norm: string;
}

export interface Tokens {
  themes: Record<Theme, Record<string, ColorValue>>;
  base: Record<string, string>;
  pairs: TokenPair[];
}

export interface Adr {
  id: string;
  title: string;
  text: string;
}

/** Les lignes du journal à trois colonnes n'ont ni alternative ni retour. */
export interface Decision {
  id: string;
  date: string;
  decision: string;
  alternative?: string | undefined;
  rollback?: string | undefined;
}

export interface Decisions {
  adrs: Adr[];
  decisions: Decision[];
}

export interface Doc {
  path: string;
  title: string;
  url: string;
  body: string;
}

export type Docs = Doc[];

export interface Data {
  components: Component[];
  tokens: Tokens;
  decisions: Decisions;
  docs: Docs;
}
