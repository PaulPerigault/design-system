/** Surface du `.wasm` telle que l'expose wasm-bindgen (`--target web`), crates/pp-color-wasm. */
export interface RawColor {
  oklchToLinearSrgb(l: number, c: number, h: number): Float64Array;
  oklchToSrgb(l: number, c: number, h: number): Float64Array;
  srgbToOklch(channels: Float64Array): Float64Array;
  linearToGamma(value: number): number;
  gammaToLinear(value: number): number;
  inSrgbGamut(l: number, c: number, h: number, epsilon: number): boolean;
  fitToGamut(l: number, c: number, h: number): Float64Array;
  toHex(l: number, c: number, h: number): string;
  hexToOklch(text: string): Float64Array;
  parseHex(text: string): Float64Array;
  renderedSrgb(l: number, c: number, h: number): Float64Array;
  relativeLuminance(channels: Float64Array): number;
  contrastRatio(a: Float64Array, b: Float64Array): number;
  apcaLc(text: Float64Array, background: Float64Array): number;
}

/** Module généré par wasm-bindgen : les fonctions de `RawColor` et l'initialisation. */
export interface Glue extends RawColor {
  default(options: { module_or_path: URL }): Promise<unknown>;
  initSync(options: { module: Uint8Array }): unknown;
}
