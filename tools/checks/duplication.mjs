// Mesure de duplication : fenêtres de lignes significatives identiques (pur, sans FS).
export const MIN_LINES = 6;

const COMMENT = /^(\/\/|\/\*|\*|\*\/)/;

/** Lignes significatives : sans blanc de marge, ni ligne vide, ni commentaire seul. */
export function significant(text) {
  return text
    .split('\n')
    .map((raw, index) => ({ line: index + 1, text: raw.trim().replace(/\s+/g, ' ') }))
    .filter(({ text: line }) => line !== '' && !COMMENT.test(line));
}

/** Fenêtres de MIN_LINES lignes qui apparaissent à au moins deux endroits. */
function repeatedWindows(sources, minLines) {
  const seen = new Map();
  for (const [file, lines] of sources) {
    for (let i = 0; i + minLines <= lines.length; i += 1) {
      const key = lines
        .slice(i, i + minLines)
        .map((l) => l.text)
        .join('\n');
      seen.set(key, [...(seen.get(key) ?? []), { file, index: i }]);
    }
  }
  return [...seen.values()].filter((places) => places.length > 1);
}

/** Regroupe les indices dupliqués d'un fichier en blocs de lignes contiguës. */
function toBlocks(file, indexes, lines) {
  const sorted = [...indexes].sort((a, b) => a - b);
  const blocks = [];
  for (const index of sorted) {
    const last = blocks.at(-1);
    if (last && index <= last.end + 1) last.end = index;
    else blocks.push({ file, start: index, end: index });
  }
  return blocks.map(({ start, end }) => ({
    file,
    from: lines[start].line,
    to: lines[end].line,
    lines: end - start + 1,
  }));
}

/**
 * @param {Map<string, string>} files chemin → contenu
 * @returns {{ total: number, duplicated: number, rate: number, blocks: object[] }}
 */
export function measure(files, minLines = MIN_LINES) {
  const sources = new Map([...files].map(([file, text]) => [file, significant(text)]));
  const covered = new Map();
  for (const places of repeatedWindows(sources, minLines)) {
    for (const { file, index } of places) {
      const set = covered.get(file) ?? new Set();
      for (let k = 0; k < minLines; k += 1) set.add(index + k);
      covered.set(file, set);
    }
  }
  const blocks = [...covered].flatMap(([file, set]) => toBlocks(file, set, sources.get(file)));
  const total = [...sources.values()].reduce((sum, lines) => sum + lines.length, 0);
  const duplicated = blocks.reduce((sum, block) => sum + block.lines, 0);
  return { total, duplicated, rate: total === 0 ? 0 : duplicated / total, blocks };
}
