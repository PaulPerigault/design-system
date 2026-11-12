/**
 * Seuils de dépliage de `SiteHeader` et de `SiteMenu` (prop `expandAt`, en rem). Une requête de
 * conteneur n'accepte pas de jeton : la liste est fermée et chaque valeur a son bloc dans
 * `site-expand.css`.
 */
export type ExpandAt = 48 | 56 | 64 | 75;

/** Seuil appliqué sans prop, ou quand la valeur reçue n'est pas dans la liste. */
export const DEFAULT_EXPAND_AT: ExpandAt = 48;

const ALLOWED: Record<ExpandAt, true> = { 48: true, 56: true, 64: true, 75: true };

/** Valeur de la liste fermée, ou le seuil par défaut. */
export function expandAtOf(value: number | undefined): ExpandAt {
  return value !== undefined && value in ALLOWED ? (value as ExpandAt) : DEFAULT_EXPAND_AT;
}
