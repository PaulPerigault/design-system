/** Résultat d'une agrégation côté `.wasm` (crates/pp-data-wasm/src/aggregate.rs). */
export interface RawAggregation {
  readonly labels: string[];
  /** Série après série, un point par groupe ; `NaN` = groupe sans valeur. */
  readonly values: Float64Array;
  free(): void;
}

/** Surface du `.wasm` telle que l'expose wasm-bindgen (`--target web`), crates/pp-data-wasm. */
export interface RawData {
  quantiles(values: Float64Array, probabilities: Float64Array): Float64Array;
  lttb(xs: Float64Array, values: Float64Array, missing: Uint8Array, target: number): Uint32Array;
  aggregate(
    labels: string[],
    values: Float64Array,
    missing: Uint8Array,
    by: string,
    operation: string,
  ): RawAggregation;
}

/** Module généré par wasm-bindgen : les fonctions de `RawData` et l'initialisation. */
export interface Glue extends RawData {
  default(options: { module_or_path: URL }): Promise<unknown>;
  initSync(options: { module: Uint8Array }): unknown;
}
