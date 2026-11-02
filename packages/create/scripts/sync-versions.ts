// À lancer à `prepack` : le gabarit publié dépend des versions réellement publiées, jamais de la
// `0.0.0` d'amorce (un paquet vide). Le fichier du dépôt n'est pas versionné à la main.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { toVersions } from '../src/domain/template.ts';
import { syncVersions } from './sync-versions-core.ts';

const FILE = join('templates', 'versions.json');
const SCOPE_LENGTH = '@paulperigault/'.length;

function manifestVersion(name: string): string | undefined {
  try {
    const manifest: unknown = JSON.parse(
      readFileSync(join('..', name.slice(SCOPE_LENGTH), 'package.json'), 'utf8'),
    );
    const version =
      typeof manifest === 'object' && manifest !== null
        ? Reflect.get(manifest, 'version')
        : undefined;
    return typeof version === 'string' ? version : undefined;
  } catch {
    return undefined;
  }
}

const current = toVersions(JSON.parse(readFileSync(FILE, 'utf8')));
const { next, changed } = syncVersions(current, manifestVersion);
writeFileSync(FILE, `${JSON.stringify(next, null, 2)}\n`);
console.log(`sync-versions : ${changed.length} version(s) alignée(s) dans ${FILE}`);
