import { posix } from 'node:path';
import { resolveIn } from '../../domain/paths.ts';
import type { PlanEntry } from '../../domain/plan.ts';
import { sitePackageJson } from '../../domain/site-package-json.ts';
import { THEME_FILE, withThemeImport } from '../../domain/theme-css.ts';
import { outputPath } from '../../domain/template.ts';
import type { SiteTemplate } from '../../domain/template.ts';
import { CreateError } from '../../errors.ts';
import { applyPlan } from '../apply-plan.ts';
import type { CreateIo, ThemeBuilder, ThemeRequest } from '../ports.ts';

const CODE_OK = 0;
const CODE_REFUSED = 1;
const CODE_USAGE = 2;
const SAFE_PATH = /^[\w./-]+$/;
const USAGE = 'usage : create <dossier> [--dry-run]';

/** Vrai si `abs` existe et n'est pas un dossier vide (un fichier compte comme occupé). */
function isOccupied(io: CreateIo, abs: string): boolean {
  if (!io.exists(abs)) return false;
  try {
    return io.readdir(abs).length > 0;
  } catch {
    return true;
  }
}

/**
 * Plan d'écriture : `package.json` généré puis fichiers du gabarit, `_` → `.`.
 * `dir` : dossier cible tel que saisi ; `name` : dernier segment du dossier résolu.
 */
function sitePlan(
  dir: string,
  template: SiteTemplate,
  name: string,
  themeCss?: string,
): PlanEntry[] {
  const templateFiles =
    themeCss === undefined
      ? template.files
      : [...withThemeImport(template.files), { path: THEME_FILE, content: themeCss }];
  const files = [
    { path: 'package.json', content: sitePackageJson(name, template.versions) },
    ...templateFiles.map(({ path, content }) => ({ path: outputPath(path), content })),
  ];
  return files
    .sort((a, b) => (a.path < b.path ? -1 : Number(a.path > b.path)))
    .map(({ path, content }) => ({ path: posix.join(dir, path), content }));
}

/** Dossier prêt pour un shell : entre guillemets simples dès qu'un caractère sort de `[\w./-]`. */
function shellQuote(dir: string): string {
  return SAFE_PATH.test(dir) ? dir : `'${dir.replaceAll("'", "'\\''")}'`;
}

function nextSteps(io: CreateIo, dir: string): void {
  io.out('');
  io.out('Prochaines étapes :');
  for (const step of [
    `cd ${shellQuote(dir)}`,
    'git init',
    'npm install',
    'npm run dev',
    'npm run verify',
  ]) {
    io.out(`  ${step}`);
  }
  io.out('Commitez package-lock.json avant la première CI (npm ci l’exige).');
}

export interface CreateArgs extends ThemeRequest {
  positionals?: string[] | undefined;
  dryRun?: boolean | undefined;
}

/** CSS de thème demandé (`undefined` sans option) ; une demande invalide lève une erreur typée. */
function themeOf(
  { accentHue, fontStack }: ThemeRequest,
  theme: ThemeBuilder | undefined,
): string | undefined {
  if (accentHue === undefined && fontStack === undefined) return undefined;
  if (theme === undefined)
    throw new CreateError('theme.invalid', 'dérivation du thème indisponible');
  const result = theme({ accentHue, fontStack });
  if (!result.ok) throw new CreateError('theme.invalid', result.message, { code: result.code });
  return result.css;
}

/**
 * `create <dossier>` : site Astro minimal consommateur du design system.
 * Ne génère jamais dans un dossier non vide, même avec `--force`. Rend le code de sortie.
 */
export function run(
  { positionals = [], dryRun = false, accentHue, fontStack }: CreateArgs,
  {
    io,
    template,
    theme,
  }: { io: CreateIo; template: SiteTemplate | undefined; theme?: ThemeBuilder | undefined },
): number {
  const [dir] = positionals;
  if (positionals.length !== 1 || dir === undefined || template === undefined) {
    io.err(USAGE);
    return CODE_USAGE;
  }
  const target = resolveIn(io, dir);
  if (isOccupied(io, target)) {
    io.err(`refus : ${dir} existe et n'est pas vide ; create n'écrit jamais par-dessus un projet`);
    return CODE_REFUSED;
  }
  const css = themeOf({ accentHue, fontStack }, theme);
  const code = applyPlan(io, sitePlan(dir, template, posix.basename(target), css), { dryRun });
  if (code === CODE_OK) nextSteps(io, dir);
  return code;
}
