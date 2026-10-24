export function normalizePath(path: string): string {
  let result = path.replaceAll('\\', '/');
  while (result.startsWith('./')) result = result.slice('./'.length);
  while (result.length > 1 && result.endsWith('/')) result = result.slice(0, -1);
  return result;
}

const segments = (path: string): string[] => normalizePath(path).split('/').filter(Boolean);

export function matchesPath(file: string, entry: string): boolean {
  const haystack = segments(file);
  const needle = segments(entry);
  if (needle.length === 0) return false;
  for (let start = 0; start + needle.length <= haystack.length; start += 1) {
    if (needle.every((segment, i) => haystack[start + i] === segment)) return true;
  }
  return false;
}

export function matchesAny(file: string, entries: readonly string[]): boolean {
  return entries.some((entry) => matchesPath(file, entry));
}
