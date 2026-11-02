// Applique une fonction aux nœuds de prose d'un HTML construit, sans rien changer d'autre.
// Tolérant : un HTML étrange dégrade en texte laissé tel quel, jamais en erreur.
const HARD = new Set(['pre', 'code', 'kbd', 'samp', 'script', 'style', 'textarea']);
const RAW = new Set(['script', 'style', 'textarea']);
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta']);
const SVG_PROSE = new Set(['title', 'desc']);
const TEXT_ATTRS = ['aria-label', 'alt', 'title', 'placeholder'];
const META_KEYS = new Set([
  'description',
  'og:title',
  'og:description',
  'twitter:title',
  'twitter:description',
]);
const TOKEN = /<!--[\s\S]*?-->|<![^>]*>|<(\/?)([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g
  .source;

const foreignLang = (attrs) => {
  const lang = /\slang=["']?([a-zA-Z-]+)/i.exec(attrs)?.[1];
  return lang !== undefined && !/^fr/i.test(lang);
};

/** `hard` : jamais touché ; `svg` : seulement `title` et `desc` ; `text` : prose. */
function childMode(parent, name, attrs) {
  if (parent === 'hard' || HARD.has(name) || foreignLang(attrs)) return 'hard';
  if (name === 'svg') return 'svg';
  if (parent === 'svg') return SVG_PROSE.has(name) ? 'text' : 'svg';
  return 'text';
}

function attrNames(name, attrs) {
  if (name !== 'meta') return TEXT_ATTRS;
  const key = /\s(?:name|property)="([^"]*)"/i.exec(attrs)?.[1];
  return META_KEYS.has(key) ? ['content'] : [];
}

function rewriteAttrs(name, attrs, fn) {
  const names = attrNames(name, attrs);
  if (names.length === 0) return attrs;
  const re = new RegExp(`(\\s(?:${names.join('|')})=")([^"]*)(")`, 'gi');
  return attrs.replace(re, (_, head, value, tail) => head + fn(value, 'attr') + tail);
}

const closeFrame = (stack, name) => {
  const index = stack.findLastIndex((frame) => frame.name === name);
  if (index > 0) stack.length = index;
};

function openTag(stack, fn, rawName, attrs) {
  const name = rawName.toLowerCase();
  const parent = stack.at(-1).mode;
  const fixed = parent === 'hard' ? attrs : rewriteAttrs(name, attrs, fn);
  const opens = !VOID.has(name) && !RAW.has(name) && !attrs.endsWith('/');
  if (opens) stack.push({ name, mode: childMode(parent, name, attrs) });
  return `<${rawName}${fixed}>`;
}

const rawEnd = (lower, from, name) => {
  const end = lower.indexOf(`</${name}`, from);
  return end < 0 ? lower.length : end;
};

/**
 * @param {string} html page construite
 * @param {(text: string, kind: 'text' | 'attr') => string} fn transformation d'un texte
 * @returns {string}
 */
export function mapText(html, fn) {
  const re = new RegExp(TOKEN, 'g');
  const lower = html.toLowerCase();
  const stack = [{ name: '', mode: 'text' }];
  const prose = (text) => (stack.at(-1).mode === 'text' && text ? fn(text, 'text') : text);
  let out = '';
  let pos = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    out += prose(html.slice(pos, m.index));
    pos = re.lastIndex;
    const [tag, slash, rawName, attrs = ''] = m;
    if (rawName === undefined) out += tag;
    else if (slash) {
      closeFrame(stack, rawName.toLowerCase());
      out += tag;
    } else {
      out += openTag(stack, fn, rawName, attrs);
      const name = rawName.toLowerCase();
      const stop = RAW.has(name) ? rawEnd(lower, pos, name) : pos;
      out += html.slice(pos, stop);
      pos = stop;
      re.lastIndex = stop;
    }
  }
  return out + prose(html.slice(pos));
}
