// Les ports du cœur, vus par Effect : des services de `Context`. Les interfaces TypeScript du cœur
// (`FileSystem`, `Clock`, ADR-0006) restent la source ; ces services ne les remplacent pas.
import { Context } from 'effect';

/** Forme synchrone du port de fichiers du cœur (extrait de `CreateIo`). */
export interface FileSystemPort {
  readText: (path: string) => string;
  writeText: (path: string, text: string) => void;
  exists: (path: string) => boolean;
}

/** Forme du port d'horloge : millisecondes depuis l'époque. */
export interface ClockPort {
  now: () => number;
}

/** Le port de fichiers comme service Effect. */
export class FileSystem extends Context.Service<FileSystem, FileSystemPort>()('pp/FileSystem') {}

/** Le port d'horloge comme service Effect. */
export class Clock extends Context.Service<Clock, ClockPort>()('pp/Clock') {}
