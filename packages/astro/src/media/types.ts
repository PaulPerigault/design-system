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
export type AltProps =
  | {
      /** Texte alternatif : ce que l'image apporte au contenu. Vide : erreur au build. */
      alt: string;
      decorative?: never;
    }
  | {
      /** Image purement décorative, rendue avec `alt=""`. Exclusif de `alt`. */
      decorative: true;
      alt?: never;
    };

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
  /** Emplacement dans la page ; règle `sizes` et les largeurs générées. */
  layout?: MediaLayout;
  /** Nature de l'image ; règle la qualité et le format de repli (JPEG pour une photo, PNG sinon). */
  kind?: MediaKind;
  /** Filet autour du cadre (captures sur fond clair). */
  rule?: boolean;
  /** Remplace `sizes` déduit de `layout`, quand la hauteur borne l'image (dialogue). */
  sizes?: string;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

export type {
  ArtDirectionProps,
  ArtSource,
  AvatarProps,
  GalleryItem,
  GalleryLabels,
  GalleryProps,
  ProjectCoverProps,
} from './component-types';
