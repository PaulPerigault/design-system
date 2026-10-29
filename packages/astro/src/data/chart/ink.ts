import tokens from '@paulperigault/tokens/tokens.json';
import { MAX_SERIES, seriesInksFromTokens } from '@paulperigault/dataviz';
import type { Result, SeriesInk } from '@paulperigault/dataviz';

/** Neutre lisible (≥ 4,5:1) sur chaque couleur de série, lu dans les jetons à chaque build. */
export const SERIES_INKS: Result<readonly SeriesInk[]> = seriesInksFromTokens(tokens, MAX_SERIES);

/**
 * Valeur de `data-ink` : neutre du thème clair puis du thème sombre (`bg-fg`) ; `undefined` si l'un
 * des deux thèmes n'a aucun neutre à 4,5:1, auquel cas le texte ne se pose pas sur la barre.
 */
export const inkAttribute = (ink: SeriesInk | undefined): string | undefined =>
  ink?.light && ink.dark ? `${ink.light}-${ink.dark}` : undefined;
