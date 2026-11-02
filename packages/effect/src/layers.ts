// Adaptateurs : un port du cœur (objet de fonctions) devient une `Layer`, et ses opérations des
// `Effect` dont l'échec est une erreur typée. Aucune logique métier ici.
import { Effect, Layer } from 'effect';
import { FileSystemError } from './errors.ts';
import { Clock, FileSystem } from './ports.ts';
import type { ClockPort, FileSystemPort } from './ports.ts';

/** `Layer` qui fournit le port de fichiers donné. */
export const fileSystemLayer = (port: FileSystemPort): Layer.Layer<FileSystem> =>
  Layer.succeed(FileSystem)(port);

/** `Layer` qui fournit l'horloge donnée. */
export const clockLayer = (port: ClockPort): Layer.Layer<Clock> => Layer.succeed(Clock)(port);

const failure = (operation: string, path: string, error: unknown): FileSystemError =>
  new FileSystemError({
    operation,
    path,
    reason: error instanceof Error ? error.message : String(error),
  });

/** Lit un fichier texte ; une exception du port devient `FileSystemError`. */
export const readText = (path: string): Effect.Effect<string, FileSystemError, FileSystem> =>
  FileSystem.use((fs) =>
    Effect.try({
      try: () => fs.readText(path),
      catch: (error) => failure('readText', path, error),
    }),
  );

/** Écrit un fichier texte ; une exception du port devient `FileSystemError`. */
export const writeText = (
  path: string,
  text: string,
): Effect.Effect<void, FileSystemError, FileSystem> =>
  FileSystem.use((fs) =>
    Effect.try({
      try: () => fs.writeText(path, text),
      catch: (error) => failure('writeText', path, error),
    }),
  );

/** Instant courant (millisecondes). */
export const now: Effect.Effect<number, never, Clock> = Clock.use((clock) =>
  Effect.sync(() => clock.now()),
);
