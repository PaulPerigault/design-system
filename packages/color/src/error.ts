/**
 * Erreurs typées. Les quatre premiers codes viennent de `pp-color` (crates/pp-color-wasm/src/fault.rs,
 * forme `code:grandeur`) ; les autres sont ceux de l'enveloppe.
 */
export type ColorErrorCode =
  | 'non-finite'
  | 'out-of-range'
  | 'invalid-hex'
  | 'out-of-gamut'
  | 'invalid-length'
  | 'not-ready'
  | 'load-failed'
  | 'internal';

export type ColorComponent = 'lightness' | 'chroma' | 'hue' | 'red' | 'green' | 'blue' | 'epsilon';

const CODES: readonly ColorErrorCode[] = [
  'non-finite',
  'out-of-range',
  'invalid-hex',
  'out-of-gamut',
  'invalid-length',
];
const COMPONENTS: readonly ColorComponent[] = [
  'lightness',
  'chroma',
  'hue',
  'red',
  'green',
  'blue',
  'epsilon',
];

export class ColorError extends Error {
  readonly code: ColorErrorCode;
  readonly component: ColorComponent | undefined;

  constructor(code: ColorErrorCode, component?: ColorComponent, options?: ErrorOptions) {
    super(component ? `${code} : ${component}` : code, options);
    this.name = 'ColorError';
    this.code = code;
    this.component = component;
  }
}

const isCode = (text: string): text is ColorErrorCode => CODES.some((code) => code === text);
const asComponent = (text: string): ColorComponent | undefined =>
  COMPONENTS.find((component) => component === text);

/** Rend une valeur levée par le `.wasm` (`'code:grandeur'`) en `ColorError` ; sinon `internal`. */
export function parseFault(raised: unknown): ColorError {
  if (raised instanceof ColorError) return raised;
  if (typeof raised !== 'string') return new ColorError('internal', undefined, { cause: raised });
  const [code = '', component = ''] = raised.split(':');
  if (!isCode(code)) return new ColorError('internal', undefined, { cause: raised });
  return new ColorError(code, asComponent(component));
}
