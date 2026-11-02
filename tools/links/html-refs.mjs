// Extraction des références d'une page HTML construite : liens à vérifier et identifiants d'ancre.
// Tolérant : un HTML étrange donne moins de références, jamais une erreur.
const TAG = /<(a|link|script|img|source|iframe|area)\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/gi;
const ATTR_BY_TAG = {
  a: 'href',
  area: 'href',
  link: 'href',
  script: 'src',
  img: 'src',
  source: 'src',
  iframe: 'src',
};
const ID = /\s(?:id|name)=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

/** Valeur d'un attribut dans le texte d'une balise ouvrante, ou `undefined`. */
export function attribute(attrs, name) {
  const match = new RegExp(`\\s${name}=(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i').exec(attrs);
  return match ? (match[1] ?? match[2] ?? match[3]) : undefined;
}

// Une seule passe : décoder `&amp;` puis `&#38;` en deux temps décoderait deux fois (CodeQL).
const decode = (value) => value.replace(/&(?:amp|#38);/g, '&');

/** @returns {{ tag: string, url: string }[]} références (`href`, `src`) d'une page */
export function extractLinks(html) {
  const links = [];
  for (const [, tag, attrs] of html.matchAll(TAG)) {
    const name = tag.toLowerCase();
    const url = attribute(attrs, ATTR_BY_TAG[name]);
    if (url !== undefined && url.trim() !== '') links.push({ tag: name, url: decode(url.trim()) });
  }
  return links;
}

/** @returns {Set<string>} identifiants (`id`, `name`) d'une page, cibles possibles d'une ancre */
export function extractIds(html) {
  const ids = new Set();
  for (const match of html.matchAll(ID)) ids.add(decode(match[1] ?? match[2] ?? match[3]));
  return ids;
}
