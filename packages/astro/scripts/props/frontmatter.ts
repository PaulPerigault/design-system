/** Lecture du frontmatter d'un composant `.astro` : texte TypeScript et valeurs par défaut. */
import ts from 'typescript';

const FENCE = /^---\r?\n([\s\S]*?)\r?\n---/;

/** Script du frontmatter (vide si le composant n'en a pas). */
export const frontmatterOf = (source: string): string => FENCE.exec(source)?.[1] ?? '';

/** `const { a = 'x', b: renamed = 2 } = Astro.props` → `{ a: "'x'", b: '2' }`. */
export function defaultsOf(script: string): Record<string, string> {
  const file = ts.createSourceFile('frontmatter.ts', script, ts.ScriptTarget.Latest, true);
  const defaults: Record<string, string> = {};
  const visit = (node: ts.Node): void => {
    if (ts.isVariableDeclaration(node) && isAstroProps(node.initializer)) {
      if (ts.isObjectBindingPattern(node.name)) collect(node.name, file, defaults);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return defaults;
}

const isAstroProps = (node: ts.Expression | undefined): boolean =>
  node !== undefined && node.getText() === 'Astro.props';

function collect(
  pattern: ts.ObjectBindingPattern,
  file: ts.SourceFile,
  out: Record<string, string>,
) {
  for (const element of pattern.elements) {
    if (element.initializer === undefined) continue;
    const key = element.propertyName ?? element.name;
    out[key.getText(file)] = element.initializer.getText(file);
  }
}
