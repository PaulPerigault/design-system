/** Un élément du registre au schéma shadcn, avec le contenu de ses fichiers, sur /r/<nom>.json. */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import registry from '@paulperigault/astro/registry.json';
import { toServedItem, type RegistryItem } from '../../lib/registry-serve.ts';

// Le build tourne dans apps/docs (npm -w) : les chemins du registre partent de la racine du dépôt.
const root = resolve(process.cwd(), '../..');
const readRepoFile = (repoPath: string): string => readFileSync(resolve(root, repoPath), 'utf8');

export function getStaticPaths() {
  return registry.items.map((item) => ({ params: { item: item.name }, props: { item } }));
}

export function GET({ props }: { props: { item: RegistryItem } }) {
  return new Response(JSON.stringify(toServedItem(props.item, readRepoFile)), {
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}
