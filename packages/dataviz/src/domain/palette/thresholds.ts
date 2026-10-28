/** Seuils de l'ADR-0007 (conventions, confirmées par les tests de ce paquet). */
export const CATEGORICAL_COUNT = 6;
export const SEQUENTIAL_COUNT = 7;
export const DIVERGING_COUNT = 7;
/** ΔE00 minimal entre toute paire de la catégorielle, après simulation des daltonismes. */
export const MIN_CATEGORICAL_DELTA = 10;
/** ΔE00 minimal entre pas voisins d'une rampe. */
export const MIN_STEP_DELTA = 3;
/** Contraste minimal d'un tracé contre le fond : WCAG 2.2, critère 1.4.11. */
export const MIN_GRAPHIC_CONTRAST = 3;
/** Contraste minimal du texte sur l'accent : WCAG 2.2, critère 1.4.3. */
export const MIN_TEXT_CONTRAST = 4.5;
