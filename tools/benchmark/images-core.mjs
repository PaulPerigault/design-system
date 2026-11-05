// Mesure du pipeline d'images : parties pures. Les fichiers de `dist/_astro` sont l'original
// copié (`nom.HASH.ext`) et ses variantes (`nom.HASH_VARIANTE.ext`), une par format et par largeur.
const FILE =
  /^(?<source>.+?\.[A-Za-z0-9-]+?)(?:_(?<variant>[A-Za-z0-9-]+))?\.(?<ext>avif|webp|jpe?g|png)$/;
const SRCSET = /\/_astro\/([^\s,"']+)\s+(\d+)w/g;
const FORMATS = ['avif', 'webp', 'repli'];
const KIB = 1024;
const PERCENT = 100;
const HALF = 2;

/** Nom de fichier → source, format et rôle ; `null` si ce n'est pas une image du pipeline. */
export function parseName(name) {
  const groups = FILE.exec(name)?.groups;
  if (!groups) return null;
  // JPEG et PNG sont le repli du `<picture>` : un seul des deux selon la source.
  const format = ['avif', 'webp'].includes(groups.ext) ? groups.ext : 'repli';
  return { source: groups.source, format, original: groups.variant === undefined };
}

/** Largeur de chaque variante, lue dans les `srcset` du HTML construit : fichier → pixels. */
export function widthsFrom(html) {
  return new Map([...html.matchAll(SRCSET)].map(([, file, width]) => [file, Number(width)]));
}

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / HALF);
  if (sorted.length === 0) return null;
  return sorted.length % HALF === 1 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / HALF;
}

/** Une ligne par source : octets de l'original et, par format, nombre de variantes et octets. */
export function summarize(files) {
  const rows = new Map();
  for (const { name, bytes } of files) {
    const parsed = parseName(name);
    if (!parsed) continue;
    const row = rows.get(parsed.source) ?? { source: parsed.source, original: 0, formats: {} };
    if (parsed.original) row.original += bytes;
    else {
      const entry = (row.formats[parsed.format] ??= { count: 0, bytes: 0 });
      entry.count += 1;
      entry.bytes += bytes;
    }
    rows.set(parsed.source, row);
  }
  return [...rows.values()].sort((a, b) => a.source.localeCompare(b.source));
}

/** Rapport d'octets `a / b` des variantes de même source et de même largeur, médiane des paires. */
export function ratio(files, widths, a, b) {
  const sizes = new Map();
  for (const { name, bytes } of files) {
    const parsed = parseName(name);
    const width = widths.get(name);
    if (!parsed || parsed.original || width === undefined) continue;
    sizes.set(`${parsed.source}@${width}@${parsed.format}`, bytes);
  }
  const pairs = [...sizes.keys()]
    .filter((key) => key.endsWith(`@${a}`))
    .map((key) => [sizes.get(key), sizes.get(key.replace(/@[^@]+$/, `@${b}`))])
    .filter(([x, y]) => x !== undefined && y !== undefined && y > 0);
  return { pairs: pairs.length, median: median(pairs.map(([x, y]) => x / y)) };
}

const kib = (bytes) => (bytes / KIB).toFixed(1);

/** Tableau Markdown : une ligne par source, puis le total. */
export function table(rows) {
  const head = [
    '| Source | Original | AVIF | WebP | Repli (JPEG ou PNG) |',
    '| --- | ---: | ---: | ---: | ---: |',
  ];
  const cell = (row, format) => {
    const entry = row.formats[format];
    return entry ? `${entry.count} × (${kib(entry.bytes)} Kio)` : '0';
  };
  const body = rows.map(
    (row) =>
      `| ${row.source} | ${kib(row.original)} Kio | ${FORMATS.map((f) => cell(row, f)).join(' | ')} |`,
  );
  const total = (pick) => rows.reduce((sum, row) => sum + pick(row), 0);
  const sum = (format) => ({
    count: total((row) => row.formats[format]?.count ?? 0),
    bytes: total((row) => row.formats[format]?.bytes ?? 0),
  });
  const totals = FORMATS.map((f) => `${sum(f).count} × (${kib(sum(f).bytes)} Kio)`);
  const last = `| **Total** | ${kib(total((row) => row.original))} Kio | ${totals.join(' | ')} |`;
  return [...head, ...body, last].join('\n');
}

export const percent = (value) => (value === null ? 'n/a' : `${(value * PERCENT).toFixed(0)} %`);
