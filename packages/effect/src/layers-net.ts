// Adaptateurs des ports réseau et de processus. Un refus du réseau ou un statut hors 2xx devient
// une `FetchError` typée ; rien ne franchit la frontière sous forme d'exception.
import { Effect, Layer } from 'effect';
import { FetchError } from './errors.ts';
import { Fetcher, Process } from './ports-net.ts';
import type { FetcherPort, ProcessPort } from './ports-net.ts';

const OK_MIN = 200;
const OK_MAX = 299;

/** `Layer` qui fournit le port réseau donné. */
export const fetcherLayer = (port: FetcherPort): Layer.Layer<Fetcher> =>
  Layer.succeed(Fetcher)(port);

/** `Layer` qui fournit le port de processus donné. */
export const processLayer = (port: ProcessPort): Layer.Layer<Process> =>
  Layer.succeed(Process)(port);

const reason = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** Corps texte d'une URL ; statut hors 2xx ou échec du réseau : `FetchError`. */
export const fetchText = (url: string): Effect.Effect<string, FetchError, Fetcher> =>
  Fetcher.use((net) =>
    Effect.tryPromise({
      try: async () => {
        const response = await net.fetch(url);
        if (response.status < OK_MIN || response.status > OK_MAX) {
          throw new Error(`statut ${response.status}`);
        }
        return response.text();
      },
      catch: (error) => new FetchError({ url, reason: reason(error) }),
    }),
  );

/** Dossier courant du processus. */
export const cwd: Effect.Effect<string, never, Process> = Process.use((proc) =>
  Effect.sync(() => proc.cwd()),
);
