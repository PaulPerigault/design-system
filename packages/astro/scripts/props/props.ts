/**
 * Propriétés d'un composant `.astro`, lues dans son type `Props` par le vérificateur TypeScript
 * (types importés résolus, unions et intersections comprises) : nom, type, caractère facultatif,
 * description (JSDoc) et valeur par défaut. Source unique des tableaux de la documentation et du
 * serveur MCP.
 */
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import ts from 'typescript';
import { defaultsOf, frontmatterOf } from './frontmatter.ts';

export interface PropInfo {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  fallback?: string;
}

const VIRTUAL = '__props__.ts';
const OPTIONS: ts.CompilerOptions = {
  strict: true,
  exactOptionalPropertyTypes: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ES2022,
  allowImportingTsExtensions: true,
  noEmit: true,
  skipLibCheck: true,
};

/** Programme TypeScript dont le seul fichier propre est le frontmatter, posé à côté du composant. */
function checkerFor(component: string, script: string) {
  // TypeScript normalise les noms de fichiers en `/` : le nom virtuel doit l'être aussi.
  const virtual = posix.join(posix.dirname(component.replaceAll('\\', '/')), VIRTUAL);
  const host = ts.createCompilerHost(OPTIONS);
  const read = host.getSourceFile.bind(host);
  host.getSourceFile = (name, version) =>
    name === virtual ? ts.createSourceFile(name, script, version, true) : read(name, version);
  const program = ts.createProgram([virtual], OPTIONS, host);
  return { checker: program.getTypeChecker(), file: program.getSourceFile(virtual) };
}

const propsNode = (file: ts.SourceFile | undefined): ts.Node | undefined =>
  file?.statements.find(
    (node) =>
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      node.name.text === 'Props',
  );

/** Union d'alias (`Ratio`) développée en ses membres ; `undefined` retiré (rendu à part). */
function typeText(checker: ts.TypeChecker, type: ts.Type): string {
  const members = type.isUnion() ? type.types : [type];
  const shown = members.filter((member) => (member.flags & ts.TypeFlags.Undefined) === 0);
  const literal = shown.every(
    (member) => member.isLiteral() || member.flags & ts.TypeFlags.BooleanLiteral,
  );
  if (!type.isUnion() || !literal) return clean(checker.typeToString(type));
  const text = shown.map((member) => checker.typeToString(member)).join(' | ');
  return text === 'false | true' ? 'boolean' : text;
}

/** `string | undefined` → `string` : le caractère facultatif est rendu à part. */
const clean = (type: string): string =>
  type.replace(/ \| undefined$/, '').replace(/^undefined \| /, '');

export function propsOf(component: string, source = readFileSync(component, 'utf8')): PropInfo[] {
  const script = frontmatterOf(source);
  const { checker, file } = checkerFor(component, script);
  const node = propsNode(file);
  if (node === undefined) return [];
  const defaults = defaultsOf(script);
  const type = checker.getTypeAtLocation(node);
  return checker.getPropertiesOfType(type).map((symbol) => {
    const fallback = defaults[symbol.name];
    return {
      name: symbol.name,
      type: typeText(checker, checker.getTypeOfSymbolAtLocation(symbol, node)),
      optional: (symbol.flags & ts.SymbolFlags.Optional) !== 0,
      description: ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim(),
      ...(fallback === undefined ? {} : { fallback }),
    };
  });
}
