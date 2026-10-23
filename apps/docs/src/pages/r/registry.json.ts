/** Index du registre au schéma shadcn, servi en statique sur /r/registry.json. */
import registry from '@paulperigault/astro/registry.json';
import { toServedIndex } from '../../lib/registry-serve.ts';

export function GET() {
  return new Response(JSON.stringify(toServedIndex(registry)), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
