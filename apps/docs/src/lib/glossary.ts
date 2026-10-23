import { GLOSSARY_PROJECT } from './glossary-project';
import { GLOSSARY_WEB } from './glossary-web';

/** Un terme défini une fois. `id` sert d'ancre `#id` sur la page du glossaire. */
export interface Entry {
  id: string;
  term: string;
  definition: string;
}

const byTerm = (a: Entry, b: Entry): number => a.term.localeCompare(b.term, 'fr');

export const GLOSSARY: readonly Entry[] = [...GLOSSARY_WEB, ...GLOSSARY_PROJECT].sort(byTerm);
