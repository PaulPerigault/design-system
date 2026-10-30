import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

// Garde de ADR-0003 : le code de src/ (tous les anneaux, sous-dossiers compris) ne fait ni
// réseau, ni exécution, ni écriture. Elle lit chaque fichier au lieu d'en compter un nombre fixe.
describe('analyse statique de src/ : ni réseau, ni exécution, ni écriture', () => {
  const dir = join(import.meta.dirname, '..', 'src');
  const names = readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name));
  const sources = names.map((name) => readFileSync(name, 'utf8'));
  const FORBIDDEN = [
    /from\s+['"](?:node:)?(?:http|https|http2|net|dns|tls|dgram)['"]/,
    /\bfetch\s*\(|\bWebSocket\b|\bXMLHttpRequest\b|\bEventSource\b/,
    /child_process|(?<![.\w])(?:spawn|exec|execSync|execFile)\s*\(/,
    /\beval\s*\(|\bFunction\s*\(|\bimport\s*\(/,
    /\b(?:writeFile|appendFile|mkdir|rm|rmdir|unlink|rename|copyFile)(?:Sync)?\s*\(/,
    /\bconsole\./,
  ];

  it('lit tous les fichiers de src/, sous-dossiers compris', () => {
    const files = names.map((name) => relative(dir, name));
    expect(sources).toHaveLength(files.length);
    expect(files.filter((file) => !file.endsWith('.ts'))).toEqual([]);
    for (const ring of ['domain', 'application', 'infrastructure']) {
      expect(
        files.some((file) => file.startsWith(`${ring}${sep}`)),
        ring,
      ).toBe(true);
    }
  });

  it.each(FORBIDDEN)('aucune occurrence de %s dans les fichiers de src/', (pattern) => {
    expect(sources.filter((source) => pattern.test(source))).toEqual([]);
  });
});
