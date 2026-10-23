import type { APIRoute } from 'astro';
import registry from '@paulperigault/astro/registry.json';
import { buildLlms } from '../lib/llms.ts';
import { GROUPS } from '../navigation';

// Même origine que `site` dans astro.config.mjs.
const SITE = 'https://ds.paulperigault.dev';

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(buildLlms({ groups: GROUPS, items: registry.items, site: SITE }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
