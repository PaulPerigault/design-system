/** Convertit le contenu de `<main>` d'une page HTML en Markdown. Pur, sans dépendance. */
import { decodeEntities, parseHtml } from './markdown-dom.mjs';
import { ORIGIN, renderTree } from './markdown-render.mjs';

export { ORIGIN };

/** @param {string} html */
export function extractMain(html) {
  return /<main[^>]*>([\s\S]*)<\/main>/i.exec(html)?.[1] ?? html;
}

/** @param {string} html */
export function extractTitle(html) {
  const title = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '';
  return decodeEntities(title).replace(/\s+/g, ' ').trim();
}

/** @param {string} html */
export function extractCanonical(html) {
  const link = /<link\b[^>]*\brel=["']?canonical["']?[^>]*>/i.exec(html)?.[0] ?? '';
  const href = /\bhref=(?:"([^"]*)"|'([^']*)')/i.exec(link);
  return href ? decodeEntities(href[1] ?? href[2]) : undefined;
}

/**
 * @param {string} html page entière ou fragment
 * @param {{ origin?: string, path?: string }} [options] base des liens relatifs
 * @returns {string}
 */
export function htmlToMarkdown(html, { origin = ORIGIN, path = '/' } = {}) {
  return renderTree(parseHtml(extractMain(String(html))), { origin, path });
}
