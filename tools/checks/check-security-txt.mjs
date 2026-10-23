// RFC 9116 : `Contact` et `Expires` obligatoires ; `Expires` dans le futur et à moins d'un an
// (une date lointaine fait perdre toute fiabilité au fichier).
import { readFileSync } from 'node:fs';

const FILE = 'apps/docs/public/.well-known/security.txt';
const MS_PER_DAY = 86_400_000;
const DAYS_PER_YEAR = 366;

/** @returns {string[]} problèmes du fichier `security.txt` */
export function securityTxtProblems(text, now = new Date()) {
  const fields = new Map(
    text
      .split('\n')
      .filter((line) => /^[A-Za-z-]+:/.test(line))
      .map((line) => [line.slice(0, line.indexOf(':')), line.slice(line.indexOf(':') + 1).trim()]),
  );
  const problems = ['Contact', 'Expires']
    .filter((key) => !fields.get(key))
    .map((key) => `${key} manquant`);
  const expires = new Date(fields.get('Expires') ?? '');
  if (Number.isNaN(expires.getTime())) return [...problems, 'Expires illisible'];
  const days = (expires.getTime() - now.getTime()) / MS_PER_DAY;
  if (days < 0) problems.push('Expires est dépassé : renouveler le fichier');
  if (days > DAYS_PER_YEAR) problems.push('Expires dépasse un an (RFC 9116)');
  return problems;
}

if (import.meta.main) {
  const problems = securityTxtProblems(readFileSync(FILE, 'utf8'));
  for (const problem of problems) console.error(`${FILE} : ${problem}`);
  if (problems.length > 0) process.exit(1);
  console.log('check-security-txt: OK');
}
