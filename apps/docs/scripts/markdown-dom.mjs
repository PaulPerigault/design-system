/** Mini-arbre HTML tolérant : jamais d'erreur, le HTML malformé dégrade en texte. */

const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  mdash: '—',
  ndash: '–',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  rsquo: '’',
  lsquo: '‘',
  copy: '©',
  times: '×',
};
const HEX_RADIX = 16;
const DEC_RADIX = 10;
const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'wbr', 'col']);
const RAW = new Set(['script', 'style']);
const AUTO_CLOSE = {
  li: ['li'],
  p: ['p'],
  dt: ['dt', 'dd'],
  dd: ['dt', 'dd'],
  tr: ['tr', 'td', 'th'],
  td: ['td', 'th'],
  th: ['td', 'th'],
};
const TOKEN = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
const ATTR = /([^\s=/"']+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function fromCode(name, whole) {
  const hex = /^#x/i.test(name);
  const code = Number.parseInt(name.replace(/^#x?/i, ''), hex ? HEX_RADIX : DEC_RADIX);
  try {
    return String.fromCodePoint(code);
  } catch {
    return whole;
  }
}

/** @param {string} text */
export function decodeEntities(text) {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name) =>
    name.startsWith('#') ? fromCode(name, whole) : (ENTITIES[name.toLowerCase()] ?? whole),
  );
}

function parseAttrs(source) {
  const attrs = {};
  for (const m of source.matchAll(ATTR)) {
    attrs[m[1].toLowerCase()] = decodeEntities(m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

function openTag(stack, tag, source) {
  const top = stack.at(-1);
  if (AUTO_CLOSE[tag]?.includes(top.tag)) stack.pop();
  const node = { tag, attrs: parseAttrs(source), children: [] };
  stack.at(-1).children.push(node);
  if (!VOID.has(tag) && !/\/\s*$/.test(source)) stack.push(node);
}

function closeTag(stack, tag) {
  const index = stack.findLastIndex((node) => node.tag === tag);
  if (index > 0) stack.length = index;
}

function addText(stack, text) {
  if (text) stack.at(-1).children.push(decodeEntities(text));
}

/**
 * @param {string} html
 * @returns {{ tag: string, attrs: Record<string, string>, children: unknown[] }}
 */
export function parseHtml(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = new RegExp(TOKEN);
  let pos = 0;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    addText(stack, html.slice(pos, m.index));
    pos = re.lastIndex;
    const tag = m[2]?.toLowerCase();
    if (!tag) continue;
    if (m[1]) {
      closeTag(stack, tag);
      continue;
    }
    openTag(stack, tag, m[3]);
    if (RAW.has(tag)) {
      const rest = html.slice(pos).search(new RegExp(`</${tag}`, 'i'));
      pos = rest < 0 ? html.length : pos + rest;
      re.lastIndex = pos;
    }
  }
  addText(stack, html.slice(pos));
  return root;
}
