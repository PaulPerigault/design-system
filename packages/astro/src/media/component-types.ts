/** Props des composants média autres que `Photo` : aucun code exécutable ici. */
import type { ImageMetadata } from 'astro';
import type { AltProps, Breakpoint, MediaKind, MediaLayout, Ratio } from './types';

/** Recadrage servi à partir d'un point de rupture (`ArtDirection`). */
export interface ArtSource {
  at: Breakpoint;
  src: ImageMetadata;
}

/** Props de `ArtDirection` : image par défaut plus recadrages par largeur d'écran. */
export type ArtDirectionProps = AltProps & {
  /** Image par défaut, importée localement. */
  src: ImageMetadata;
  /** Recadrages : un par point de rupture (`narrow`, `medium`). */
  sources: ArtSource[];
  /** Image principale de la page (LCP) : chargée tout de suite, en priorité. */
  priority?: boolean;
  /** Emplacement dans la page ; règle `sizes` et les largeurs générées. */
  layout?: MediaLayout;
  /** Nature de l'image ; règle la qualité et le format de repli. */
  kind?: MediaKind;
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Props d'`Avatar` : image carrée, taille par token d'espacement. */
export type AvatarProps = AltProps & {
  /** Image carrée, importée localement (aucun visage dans la doc). */
  src: ImageMetadata;
  /** Taille : `s`, `m` ou `l` (tokens `--pp-space-xl`, `-2xl`, `-3xl`). */
  size?: 's' | 'm' | 'l';
  /** Réservé au placement du composant dans son parent. */
  class?: string;
};

/** Props de `ProjectCover` : couverture de projet, toujours filetée. */
export type ProjectCoverProps = AltProps & {
  /** Image importée localement. */
  src: ImageMetadata;
  /** Proportion du cadre. */
  ratio?: 'landscape' | 'wide';
  /** Emplacement dans la page ; règle `sizes`. */
  layout?: 'third' | 'half' | 'page';
  /** Nature de l'image ; une capture garde un texte net. */
  kind?: MediaKind;
  /** Image principale de la page (LCP). */
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
  /** Images : `{ src, alt, caption? }` ; l'alternative est obligatoire. */
  items: GalleryItem[];
  /** Proportion des vignettes. */
  ratio?: Ratio;
} & (
  | { enlarge?: false; labels?: never }
  | {
      /** Chaque vignette ouvre l'image entière dans un dialogue natif. */
      enlarge: true;
      /** Libellés `{ open, close }` des boutons d'agrandissement, fournis par le site. */
      labels: GalleryLabels;
    }
);
