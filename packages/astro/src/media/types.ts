/** Types du pipeline d'images : aucun code exécutable ici. */
import type { ImageMetadata } from 'astro';

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

/** Props de `Photo` (et base des autres composants média). */
export type PhotoProps = AltProps & {
  /** Image importée localement (`import photo from './photo.jpg'`). */
  src: ImageMetadata;
  /** Proportion du cadre ; absente, l'image garde sa proportion propre. */
  ratio?: Ratio;
  /** Point gardé visible quand le cadre recadre l'image. */
  focal?: Focal;
  /** Image principale de la page (LCP) : chargée tout de suite, en priorité. */
  priority?: boolean;
  layout?: MediaLayout;
  kind?: MediaKind;
  /** Filet autour du cadre (captures sur fond clair). */
  rule?: boolean;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Recadrage servi à partir d'un point de rupture (`ArtDirection`). */
export interface ArtSource {
  at: Breakpoint;
  src: ImageMetadata;
}

/** Props de `ArtDirection` : image par défaut plus recadrages par largeur d'écran. */
export type ArtDirectionProps = AltProps & {
  src: ImageMetadata;
  sources: ArtSource[];
  priority?: boolean;
  layout?: MediaLayout;
  kind?: MediaKind;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Props d'`Avatar` : image carrée, taille par token d'espacement. */
export type AvatarProps = AltProps & {
  src: ImageMetadata;
  size?: 's' | 'm' | 'l';
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Props de `ProjectCover` : couverture de projet, toujours filetée. */
export type ProjectCoverProps = AltProps & {
  src: ImageMetadata;
  ratio?: 'landscape' | 'wide';
  layout?: 'third' | 'half' | 'page';
  kind?: MediaKind;
  priority?: boolean;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Image de galerie : l'alternative est obligatoire (une galerie est du contenu). */
export interface GalleryItem {
  src: ImageMetadata;
  alt: string;
  caption?: string;
}

/** Libellés des boutons d'agrandissement, fournis par le site (traduits). */
export interface GalleryLabels {
  open: string;
  close: string;
}

/** Props de `Gallery` : `enlarge` exige ses libellés. */
export type GalleryProps = {
  /** Préfixe des identifiants des dialogues. */
  id: string;
  items: GalleryItem[];
  ratio?: Ratio;
} & ({ enlarge?: false; labels?: never } | { enlarge: true; labels: GalleryLabels });
