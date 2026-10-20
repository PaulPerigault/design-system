/**
 * Identifiants partagés entre `Field` et le contrôle qu'il enveloppe. `Field` rend l'indication
 * sous `<id>-hint` et l'erreur sous `<id>-error` ; le contrôle (Input, Textarea, Select…) s'y relie :
 *
 * ```astro
 * <input
 *   id={id}
 *   aria-describedby={describedBy({ id, hint, error })}
 *   aria-invalid={error ? 'true' : undefined}
 * />
 * ```
 *
 * L'erreur est un texte statique rendu par le serveur : aucune région `aria-live`.
 */

export interface FieldIds {
  hint: string;
  error: string;
}

export interface DescribedByInput {
  id: string;
  hint?: string | undefined;
  error?: string | undefined;
}

/** Ids de l'indication et de l'erreur d'un champ d'id `id`. */
export const fieldIds = (id: string): FieldIds => ({ hint: `${id}-hint`, error: `${id}-error` });

/**
 * Valeur d'`aria-describedby` : ids de l'indication puis de l'erreur, seulement si leur texte est
 * non vide ; `undefined` sinon, pour qu'Astro omette l'attribut.
 */
export const describedBy = ({ id, hint, error }: DescribedByInput): string | undefined => {
  const ids = fieldIds(id);
  const parts = [hint ? ids.hint : '', error ? ids.error : ''].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : undefined;
};
