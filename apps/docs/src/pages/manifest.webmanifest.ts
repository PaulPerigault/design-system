import type { APIRoute } from 'astro';
import { buildManifest } from '../lib/pwa';

/** Endpoint statique : /manifest.webmanifest */
export const GET: APIRoute = () =>
  new Response(JSON.stringify(buildManifest()), {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
