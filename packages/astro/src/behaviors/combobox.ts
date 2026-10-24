/**
 * Combobox, motif APG « List Autocomplete » : logique pure (`filterOptions`, `reduceKey`) puis
 * branchement DOM (`enhance`). Le focus reste dans le champ (`aria-activedescendant`) ; la saisie
 * filtre la liste sans jamais sélectionner d'option d'elle-même.
 */

export type ComboOption = { value: string; label: string };

/** `active` : index parmi les `count` options visibles, -1 si aucune. */
export type ComboState = { open: boolean; active: number; count: number };

/** `commit` : valider l'option active ; `clear` : vider le champ ; `handled` : `preventDefault`. */
type Effect = 'none' | 'commit' | 'clear';
export type KeyResult = { state: ComboState; effect: Effect; handled: boolean };

/** Id stable d'une option, partagé par le rendu serveur et le script. */
export const optionId = (id: string, index: number): string => `${id}-option-${index}`;

/** Minuscules, sans accents ni espaces de bord : « Été » et « ete » se valent. */
export const normalize = (text: string): string =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim();

/** Options dont le libellé contient la requête (casse et accents ignorés) ; vide : toutes. */
export function filterOptions<T extends ComboOption>(options: readonly T[], query: string): T[] {
  const needle = normalize(query);
  return options.filter((option) => normalize(option.label).includes(needle));
}

/** Après une saisie : liste ouverte s'il reste des options, aucune option active. */
export const onQuery = (count: number): ComboState => ({ open: count > 0, active: -1, count });

/** Texte de la zone `role="status"` : `{count}` remplacé, ou `noResults` à zéro. */
export const statusText = (count: number, countLabel: string, noResults: string): string =>
  count === 0 ? noResults : countLabel.replaceAll('{count}', String(count));

function done(state: ComboState, effect: Effect = 'none', handled = true): KeyResult {
  return { state, effect, handled };
}

const close = (state: ComboState): ComboState => ({ ...state, open: false, active: -1 });

/** Flèches : ouvrent la liste, déplacent l'option active et bouclent aux extrémités. */
const move = (state: ComboState, step: 1 | -1): KeyResult => {
  if (state.count === 0) return done(close(state));
  const from = state.active === -1 ? (step === 1 ? -1 : state.count) : state.active;
  return done({ ...state, open: true, active: (from + step + state.count) % state.count });
};

const KEYS: Readonly<Record<string, (state: ComboState) => KeyResult>> = {
  ArrowDown: (state) => move(state, 1),
  ArrowUp: (state) => move(state, -1),
  Enter: (state) =>
    state.open && state.active !== -1 ? done(close(state), 'commit') : done(state, 'none', false),
  Escape: (state) => (state.open ? done(close(state)) : done(state, 'clear')),
  Tab: (state) => done(close(state), 'none', false),
};

/** Touche pressée dans le champ ; Home, End et les autres touches restent au curseur du champ. */
export function reduceKey(state: ComboState, key: string): KeyResult {
  const handler = Object.hasOwn(KEYS, key) ? KEYS[key] : undefined;
  return handler ? handler(state) : done(state, 'none', false);
}

type Parts = { input: HTMLInputElement; listbox: HTMLElement; options: HTMLElement[] };

const labelOf = (node: Element | null | undefined): string => node?.textContent?.trim() ?? '';
const visibleOf = ({ options }: Parts): HTMLElement[] => options.filter((node) => !node.hidden);

/** Masque les options qui ne répondent pas au champ ; renvoie le nombre d'options visibles. */
const applyFilter = ({ input, options }: Parts): number => {
  const items = options.map((node) => ({ node, value: node.id, label: labelOf(node) }));
  const shown = new Set(filterOptions(items, input.value).map((item) => item.node));
  for (const node of options) node.hidden = !shown.has(node);
  return shown.size;
};

const render = (parts: Parts, state: ComboState): void => {
  const active = state.open ? visibleOf(parts)[state.active] : undefined;
  parts.listbox.hidden = !state.open;
  parts.input.setAttribute('aria-expanded', String(state.open));
  if (active) parts.input.setAttribute('aria-activedescendant', active.id);
  else parts.input.removeAttribute('aria-activedescendant');
  for (const node of parts.options) node.setAttribute('aria-selected', String(node === active));
  active?.scrollIntoView?.({ block: 'nearest' });
};

/** Branche une racine `[data-pp-combobox]` ; faux si le balisage est incomplet. */
export function enhance(root: HTMLElement): boolean {
  const input = root.querySelector<HTMLInputElement>('[role="combobox"]');
  const listbox = root.querySelector<HTMLElement>('[role="listbox"]');
  const status = root.querySelector('[role="status"]');
  if (!input || !listbox || !status) return false;
  const parts = { input, listbox, options: [...listbox.querySelectorAll<HTMLElement>('li')] };
  const { countLabel = '', noResultsLabel = '' } = root.dataset;
  let state: ComboState = { open: false, active: -1, count: applyFilter(parts) };
  const settle = (next: ComboState, value?: string): void => {
    if (value !== undefined) input.value = value;
    render(parts, (state = { ...next, count: applyFilter(parts) }));
  };
  input.removeAttribute('list');
  root.dataset.enhanced = 'true';
  input.addEventListener('input', () => {
    const count = applyFilter(parts);
    status.textContent = statusText(count, countLabel, noResultsLabel);
    settle(onQuery(count));
  });
  input.addEventListener('keydown', (event) => {
    const { state: next, effect, handled } = reduceKey(state, event.key);
    if (handled) event.preventDefault();
    const value = { none: undefined, clear: '', commit: labelOf(visibleOf(parts)[state.active]) };
    settle(next, value[effect]);
  });
  input.addEventListener('blur', () => settle(close(state)));
  listbox.addEventListener('mousedown', (event) => event.preventDefault());
  listbox.addEventListener('click', ({ target }) => {
    const option = (target as Element | null)?.closest?.('[role="option"]');
    if (option) settle(close(state), labelOf(option));
  });
  return true;
}
