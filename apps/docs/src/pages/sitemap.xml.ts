import type { APIRoute } from 'astro';
import { canonicalOf } from '../lib/seo.ts';

export const prerender = true;

/** `./components/stack.astro` → `/components/stack/` ; `./index.astro` → `/`. */
const pathOf = (file: string): string => {
  const route = file.replace(/^\.\//, '').replace(/\.astro$/, '');
  return canonicalOf(route === 'index' ? '/' : route.replace(/\/index$/, ''));
};

const escapeXml = (text: string): string => text.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const urls = Object.keys(import.meta.glob('./**/*.astro'))
  .map(pathOf)
  .sort();

export const GET: APIRoute = () => {
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
