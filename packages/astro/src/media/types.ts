/** Types du pipeline d'images : aucun code exécutable ici. */

/** Proportions servies, une par token `--pp-ratio-*`. */
export type Ratio = 'portrait' | 'square' | 'landscape' | 'wide';

/** Point focal du recadrage (`object-position`). */
export type Focal =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/** Emplacement de l'image dans la page : détermine `sizes` et les largeurs générées. */
export type MediaLayout = 'page' | 'measure' | 'half' | 'third' | 'avatar';

/** Nature de l'image : détermine la qualité et le format de repli. */
export type MediaKind = 'photo' | 'capture' | 'illustration';

/** Points de rupture de la direction artistique (`<source media>`). */
export type Breakpoint = 'narrow' | 'medium';

/**
 * Texte alternatif obligatoire, ou image explicitement décorative (`alt=""`).
 * Impossible d'omettre les deux ou de passer les deux.
 */
export type AltProps = { alt: string; decorative?: never } | { decorative: true; alt?: never };
