// Ports de processus et de réseau, vus par Effect (`Process`, `Fetcher` injectés à la
// frontière). Aucun accès réseau ni processus réel ici : tout vient du port fourni.
import { Context } from 'effect';

/** Réponse minimale d'un `fetch` : statut et corps texte. */
export interface FetchResponse {
  status: number;
  text: () => Promise<string>;
}

/** Port réseau : la signature de `fetch` réduite à ce que le cœur utilise. */
export interface FetcherPort {
  fetch: (url: string) => Promise<FetchResponse>;
}

/** Port de processus : dossier courant et arguments. */
export interface ProcessPort {
  cwd: () => string;
  argv: () => readonly string[];
}

/** Le port réseau comme service Effect. */
export class Fetcher extends Context.Service<Fetcher, FetcherPort>()('pp/Fetcher') {}

/** Le port de processus comme service Effect. */
export class Process extends Context.Service<Process, ProcessPort>()('pp/Process') {}
