/** Rendu Markdown d'un arbre HTML (voir markdown-dom.mjs). */
import { URL } from 'node:url';
import {
  block,
  dl,
  isIgnored,
  list,
  oneLine,
  pre,
  quote,
  table,
  textOf,
  tidy,
} from './markdown-blocks.mjs';

export const ORIGIN = 'https://design.paulperigault.dev';
const SAFE_PROTOCOL = /^(https?|mailto|tel):$/;
const HEADING = /^h([1-6])$/;
const CONTAINERS = [
  ...['p', 'div', 'section', 'article', 'header', 'footer', 'main', 'aside', 'figure'],
  ...['figcaption', 'details', 'summary', 'form', 'fieldset', 'address', 'body', 'html'],
];

function absolute(href, ctx) {
  if (!href) return '';
  try {
    const url = new URL(href, new URL(ctx.path, ctx.origin));
    return SAFE_PROTOCOL.test(url.protocol) ? url.href : '';
  } catch {
    return href;
  }
}

/** Applique `format` au texte sans ses espaces de bord, qui sont conservés. */
function spaced(text, format) {
  const trimmed = text.trim();
  if (!trimmed) return text;
  return (text.startsWith(' ') ? ' ' : '') + format(trimmed) + (text.endsWith(' ') ? ' ' : '');
}

const emphasis = (mark) => (node, ctx) =>
  spaced(ctx.inline(node.children), (text) => `${mark}${text}${mark}`);

function link(node, ctx) {
  const href = absolute(node.attrs.href, ctx);
  return spaced(ctx.inline(node.children), (text) => {
    const label = oneLine(text);
    return href ? `[${label}](${href})` : label;
  });
}

function code(node) {
  const text = oneLine(textOf(node));
  if (!text) return '';
  return text.includes('`') ? `\`\` ${text} \`\`` : `\`${text}\``;
}

function image(node, ctx) {
  const alt = oneLine(node.attrs.alt ?? '');
  const src = absolute(node.attrs.src, ctx);
  return alt && src ? `![${alt}](${src})` : '';
}

const heading = (level) => (node, ctx) => {
  const text = oneLine(ctx.inline(node.children));
  return text ? block(`${'#'.repeat(level)} ${text}`) : '';
};

const HANDLERS = {
  ul: list,
  ol: list,
  table,
  dl,
  blockquote: quote,
  pre,
  code,
  img: image,
  a: link,
  strong: emphasis('**'),
  b: emphasis('**'),
  em: emphasis('*'),
  i: emphasis('*'),
  br: () => '\n',
};

export function renderNode(node, ctx) {
  if (typeof node === 'string') return node.replace(/\s+/g, ' ');
  if (isIgnored(node)) return '';
  const level = HEADING.exec(node.tag)?.[1];
  const handler = level ? heading(Number(level)) : HANDLERS[node.tag];
  if (handler) return handler(node, ctx);
  const inner = ctx.inline(node.children);
  return CONTAINERS.includes(node.tag) ? block(inner) : inner;
}

export function renderTree(root, { origin, path }) {
  const ctx = { origin, path, inline: (nodes) => nodes.map((n) => renderNode(n, ctx)).join('') };
  return tidy(ctx.inline(root.children));
}
