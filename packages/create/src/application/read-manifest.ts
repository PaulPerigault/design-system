import { isPlainObject } from '../domain/json.ts';
import { MANIFEST } from '../domain/manifest.ts';
import type { Manifest } from '../domain/manifest.ts';
import { resolveIn } from '../domain/paths.ts';
import { PACKAGE_NAME } from '../domain/registry.ts';
import { messageOf } from '../domain/snippet.ts';
import type { CreateIo } from './ports.ts';

/** `null` (message sur `io.err`) si illisible ou pas un objet. */
function parseManifest(io: CreateIo, text: string): Manifest | null {
  try {
    const data: unknown = JSON.parse(text);
    if (isPlainObject(data)) return { text, data };
    io.err(`${MANIFEST} doit contenir un objet JSON`);
  } catch (error) {
    io.err(`${MANIFEST} illisible (JSON invalide) : ${messageOf(error)}`);
  }
  return null;
}

/** `null` (message sur `io.err`) si absent ou inutilisable. */
export function readManifest(io: CreateIo): Manifest | null {
  const path = resolveIn(io, MANIFEST);
  if (!io.exists(path)) {
    io.err(`${MANIFEST} introuvable dans ${io.cwd} : add ajoute ${PACKAGE_NAME} à ses dépendances`);
    return null;
  }
  return parseManifest(io, io.readText(path));
}
