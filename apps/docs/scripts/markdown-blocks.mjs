/** Blocs Markdown : listes, tableaux, définitions, citations, code. */

const MIN_FENCE = 3;
const SECTIONS = ['thead', 'tbody', 'tfoot'];
const IGNORED = new Set(['script', 'style', 'svg', 'nav', 'dialog', 'template', 'button', 'input']);

export const isTag = (node, ...tags) => typeof node !== 'string' && tags.includes(node.tag);

export function isIgnored(node) {
  if (typeof node === 'string') return false;
  const { attrs } = node;
  return IGNORED.has(node.tag) || attrs.hidden !== undefined || attrs['aria-hidden'] === 'true';
}

const visible = (node) => !isIgnored(node);
export const oneLine = (text) => text.replace(/\s+/g, ' ').trim();
export const block = (text) => `\n\n${text.trim()}\n\n`;

export function textOf(node) {
  if (typeof node === 'string') return node;
  return isIgnored(node) ? '' : node.children.map(textOf).join('');
}

/** Normalise les espaces hors blocs de code clôturés. */
export function tidy(text, compact = false) {
  const out = [];
  let fence = '';
  for (const raw of text.split('\n')) {
    if (fence) {
      out.push(raw);
      fence = raw.trim() === fence ? '' : fence;
      continue;
    }
    const line = raw.trimEnd();
    if (!keepLine(line, out, compact)) continue;
    out.push(line);
    fence = FENCE.exec(line)?.[1] ?? '';
  }
  return out.join('\n').trim();
}

const FENCE = /^\s*(`{3,})/;

/** Une ligne vide est ignorée en mode compact ou si la précédente est déjà vide. */
function keepLine(line, out, compact) {
  return Boolean(line) || !(compact || out.at(-1) === '');
}

function item(li, marker, ctx) {
  const body = tidy(ctx.inline(li.children), true);
  return marker + body.split('\n').join(`\n${' '.repeat(marker.length)}`);
}

export function list(node, ctx) {
  const ordered = node.tag === 'ol';
  let count = 0;
  const lines = node.children.filter(visible).map((child) => {
    if (!isTag(child, 'li')) return ctx.inline([child]);
    count += 1;
    return item(child, ordered ? `${count}. ` : '- ', ctx);
  });
  return block(lines.filter((line) => line.trim()).join('\n'));
}

function rowsOf(node) {
  return node.children.filter(visible).flatMap((child) => {
    if (isTag(child, 'tr')) return [child];
    return isTag(child, ...SECTIONS) ? rowsOf(child) : [];
  });
}

function cellsOf(row, ctx) {
  return row.children
    .filter((cell) => visible(cell) && isTag(cell, 'th', 'td'))
    .map((cell) => oneLine(ctx.inline(cell.children)).replace(/\|/g, '\\|'));
}

export function table(node, ctx) {
  const rows = rowsOf(node).map((row) => cellsOf(row, ctx));
  const width = Math.max(0, ...rows.map((row) => row.length));
  const caption = node.children.find((child) => isTag(child, 'caption'));
  const title = caption ? oneLine(ctx.inline(caption.children)) : '';
  const head = title ? block(`*${title}*`) : '';
  if (!width) return head;
  const format = (row) =>
    `| ${Array.from({ length: width }, (_, i) => row[i] ?? '').join(' | ')} |`;
  const [first, ...rest] = rows.map(format);
  const separator = format(Array.from({ length: width }, () => '---'));
  return head + block([first, separator, ...rest].join('\n'));
}

export function dl(node, ctx) {
  const entries = node.children
    .filter(visible)
    .flatMap((child) => (isTag(child, 'div') ? child.children.filter(visible) : [child]));
  const lines = entries
    .filter((child) => isTag(child, 'dt', 'dd'))
    .map((child) => ({ term: child.tag === 'dt', text: oneLine(ctx.inline(child.children)) }))
    .filter(({ text }) => text)
    .map(({ term, text }) => (term ? `**${text}**` : `: ${text}`));
  return block(lines.join('\n'));
}

export function quote(node, ctx) {
  const lines = tidy(ctx.inline(node.children)).split('\n');
  return block(lines.map((line) => (line ? `> ${line}` : '>')).join('\n'));
}

export function pre(node) {
  const code = node.children.find((child) => isTag(child, 'code'));
  const classes = `${node.attrs.class ?? ''} ${code?.attrs.class ?? ''}`;
  const lang = /language-([\w+-]+)/.exec(classes)?.[1] ?? '';
  const body = textOf(code ?? node).replace(/\n$/, '');
  const run = Math.max(0, ...[...body.matchAll(/`+/g)].map((m) => m[0].length));
  const fence = '`'.repeat(Math.max(MIN_FENCE, run + 1));
  return `\n\n${fence}${lang}\n${body}\n${fence}\n\n`;
}
