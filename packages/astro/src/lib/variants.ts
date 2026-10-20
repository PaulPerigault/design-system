type Groups = Record<string, Record<string, string>>;
type Selection = Record<string, string | undefined>;
type Values<V extends Groups> = { [K in keyof V & string]: keyof V[K] & string };

type Defaults<V extends Groups> = { [K in keyof V & string]?: keyof V[K] & string };

/** Condition non vide : au moins une clé de variante est obligatoire. */
type When<V extends Groups> = {
  [K in keyof V & string]-?: Partial<Values<V>> & { [P in K]-?: Values<V>[P] };
}[keyof V & string];

export interface VariantsConfig<V extends Groups, D extends Defaults<V>> {
  base?: string;
  variants: V;
  defaults?: D;
  compound?: ReadonlyArray<{ when: When<V>; class: string }>;
}

type Flatten<T> = { [K in keyof T]: T[K] };
type OptionalKeys<V extends Groups, D> = keyof D & keyof V & string;

export type Props<V extends Groups, D> = Flatten<
  { [K in Exclude<keyof V & string, OptionalKeys<V, D>>]: Values<V>[K] } & {
    [K in OptionalKeys<V, D>]?: Values<V>[K];
  }
>;

type Args<P> = object extends P ? [props?: P] : [props: P];

export type VariantFn<P> = (...args: Args<P>) => string;

/** Type des propriétés acceptées par une fonction créée par `variants()`. */
export type VariantProps<T extends (...args: never[]) => string> = T extends (
  ...args: infer A
) => string
  ? NonNullable<A[0]>
  : never;

interface Runtime {
  base?: string;
  variants: Groups;
  defaults?: Selection;
  compound?: ReadonlyArray<{ when: Selection; class: string }>;
}

const own = (target: object, key: string): boolean => Object.hasOwn(target, key);

const pick = (source: Selection | undefined, key: string): string | undefined =>
  source && own(source, key) ? source[key] : undefined;

const variantClass = (groups: Groups, key: string, value: string | undefined): string => {
  if (value === undefined) return '';
  const group = groups[key];
  return group && own(group, value) ? (group[value] ?? '') : '';
};

const matches = (when: Selection, selected: Selection): boolean => {
  const entries = Object.entries(when);
  return entries.length > 0 && entries.every(([key, value]) => selected[key] === value);
};

const tokens = (parts: ReadonlyArray<string | undefined>): string[] =>
  parts.flatMap((part) => (part ?? '').split(/\s+/)).filter(Boolean);

export function variants<V extends Groups, const D extends Defaults<V> = Record<never, never>>(
  config: VariantsConfig<V, D>,
): VariantFn<Props<V, D>> {
  const runtime = config as unknown as Runtime;
  const compose = (props: Selection = {}): string => {
    const selected: Selection = {};
    const keys = Object.keys(runtime.variants);
    for (const key of keys) {
      selected[key] = pick(props, key) ?? pick(runtime.defaults, key);
    }
    const fromVariants = keys.map((key) => variantClass(runtime.variants, key, selected[key]));
    const fromCompound = (runtime.compound ?? [])
      .filter((entry) => matches(entry.when, selected))
      .map((entry) => entry.class);
    return [...new Set(tokens([runtime.base, ...fromVariants, ...fromCompound]))].join(' ');
  };
  return compose as unknown as VariantFn<Props<V, D>>;
}
