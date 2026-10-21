// Lecture minimale de robots.txt : règles du groupe `User-agent: *`, la plus longue l'emporte
// (RFC 9309, §2.2.2). Une erreur de lecture vaut refus : on n'observe pas sans autorisation lisible.

/** Lignes `champ: valeur`, commentaires retirés, champ en minuscules. */
const fieldsOf = (text) =>
  text
    .split('\n')
    .map((raw) => raw.replace(/#.*/, '').trim())
    .filter((line) => line.includes(':'))
    .map((line) => {
      const index = line.indexOf(':');
      return [line.slice(0, index).trim().toLowerCase(), line.slice(index + 1).trim()];
    });

/** @returns {{ allow: string[], disallow: string[] }} */
export function starGroup(text) {
  const rules = { allow: [], disallow: [] };
  let inStar = false;
  let lastWasAgent = false;
  for (const [field, value] of fieldsOf(text)) {
    const agent = field === 'user-agent';
    // Plusieurs User-agent consécutifs forment un seul groupe.
    if (agent) inStar = (lastWasAgent && inStar) || value === '*';
    else if (inStar && field in rules && value !== '') rules[field].push(value);
    lastWasAgent = agent;
  }
  return rules;
}

const matches = (path, pattern) => {
  const regex = new RegExp(
    `^${pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\\\$$/, '$')}`,
  );
  return regex.test(path);
};

/** Vrai si `path` est permis : la règle correspondante la plus longue l'emporte, `allow` à égalité. */
export function allowed(rules, path) {
  const best = (list) => Math.max(-1, ...list.filter((p) => matches(path, p)).map((p) => p.length));
  return best(rules.allow) >= best(rules.disallow);
}

export async function robotsAllows(url, fetchImpl = fetch) {
  const { origin, pathname } = new URL(url);
  try {
    const response = await fetchImpl(`${origin}/robots.txt`);
    if (response.status >= 400 && response.status < 500) return true; // pas de robots.txt : permis
    if (!response.ok) return false;
    return allowed(starGroup(await response.text()), pathname);
  } catch {
    return false;
  }
}
