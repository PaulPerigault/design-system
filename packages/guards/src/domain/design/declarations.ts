// Découpe un texte CSS en déclarations `propriété: valeur`, avec leur bloc et leur position.
const DECLARATION = /([\w-]+)\s*:\s*([^;]*)(?:;|$)/g;

export interface Declaration {
  prop: string;
  value: string;
  index: number;
  block: number;
}

function parseSegment(text: string, offset: number, block: number): Declaration[] {
  return [...text.matchAll(DECLARATION)].flatMap((m) => {
    const [, prop, value] = m;
    if (prop === undefined || value === undefined) return [];
    return [
      { prop: prop.toLowerCase(), value: value.trim(), index: offset + (m.index ?? 0), block },
    ];
  });
}

/** Avant `{` : sélecteur ou règle @ ; seules les déclarations closes par `;` comptent. */
function closedDeclarations(segment: string, token: string): string {
  return token === '{' ? segment.slice(0, segment.lastIndexOf(';') + 1) : segment;
}

export function declarations(css: string): Declaration[] {
  const found: Declaration[] = [];
  const stack = [0];
  let created = 0;
  let position = 0;
  for (const match of css.matchAll(/[{}]|$/g)) {
    const token = match[0];
    const at = match.index ?? 0;
    const text = closedDeclarations(css.slice(position, at), token);
    found.push(...parseSegment(text, position, stack.at(-1) ?? 0));
    position = at + token.length;
    if (token === '{') stack.push((created += 1));
    else if (token === '}' && stack.length > 1) stack.pop();
  }
  return found;
}
