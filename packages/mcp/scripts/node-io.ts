import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import process from 'node:process';
import { format, resolveConfig } from 'prettier';

export interface BuildIo {
  list: (dir: string) => string[];
  read: (path: string) => string;
  exists: (path: string) => boolean;
  write: (path: string, text: string) => void;
  /** Forme Prettier du dépôt pour le fichier `name` de `data/`. */
  format: (name: string, text: string) => Promise<string>;
  err: (text: string) => void;
}

export function nodeIo(root: string, out: string): BuildIo {
  const at = (path: string): string => join(root, path);
  return {
    list: (dir) =>
      readdirSync(at(dir), { recursive: true, encoding: 'utf8' }).map((p) =>
        p.split(sep).join('/'),
      ),
    read: (path) => readFileSync(at(path), 'utf8'),
    exists: (path) => existsSync(at(path)),
    write(path, text) {
      mkdirSync(dirname(at(path)), { recursive: true });
      writeFileSync(at(path), text);
    },
    format: async (name, text) => {
      const filepath = at(`${out}/${name}`);
      return format(text, { ...(await resolveConfig(filepath)), filepath });
    },
    err: (text) => void process.stderr.write(text),
  };
}
