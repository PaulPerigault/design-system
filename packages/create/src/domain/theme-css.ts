import { CreateError } from '../errors.ts';

export const THEME_FILE = 'src/styles/pp-theme.css';
const LAYOUT_FILE = 'src/layouts/Base.astro';
const CSS_MODULE = '@paulperigault/css';
const CSS_IMPORT = `import '${CSS_MODULE}';`;
const THEME_MODULE = '../styles/pp-theme.css';
const THEME_IMPORT = `import '${THEME_MODULE}';`;
const INDENT = '  ';
const HEADER =
  '/* Généré par pp-create (teinte d’accent, pile de police) : à régénérer, ne pas éditer. */';

export type ThemeColors = Readonly<Record<'light' | 'dark', Readonly<Record<string, string>>>>;

/** Feuille de surcharge : variables `--pp-*` en `light-dark(clair, sombre)`, pile de police. */
export function themeCss({
  colors,
  fontStack,
}: {
  colors?: ThemeColors | undefined;
  fontStack?: string | undefined;
}): string {
  const lines: string[] = [];
  for (const [name, light] of Object.entries(colors?.light ?? {}).sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    lines.push(`${INDENT}${name}: light-dark(${light}, ${colors?.dark[name] ?? light});`);
  }
  if (fontStack !== undefined) lines.push(`${INDENT}--pp-font-family-sans: ${fontStack};`);
  return `${HEADER}\n\n:root {\n${lines.join('\n')}\n}\n`;
}

/** Ajoute l'import de la feuille de thème dans la mise en page du gabarit (après celui de css). */
export function withThemeImport(
  files: { path: string; content: string }[],
): { path: string; content: string }[] {
  return files.map((file) => {
    if (file.path !== LAYOUT_FILE) return file;
    if (!file.content.includes(CSS_IMPORT)) {
      throw new CreateError(
        'theme.template',
        `${LAYOUT_FILE} : l'import de @paulperigault/css est introuvable`,
        { path: LAYOUT_FILE },
      );
    }
    return { ...file, content: file.content.replace(CSS_IMPORT, `${CSS_IMPORT}\n${THEME_IMPORT}`) };
  });
}
