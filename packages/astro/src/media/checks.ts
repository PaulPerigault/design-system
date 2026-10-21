import type { ImageMetadata } from 'astro';
import type { AltProps } from './types';

/**
 * Valeur de l'attribut `alt` : `''` pour une image décorative, sinon le texte fourni.
 * Un texte vide ou blanc est refusé : une image sans information passe par `decorative`.
 */
export function altOf(props: AltProps): string {
  if (props.decorative === true) return '';
  // Lecture en `unknown` : un appelant non typé (MDX, JS) peut omettre `alt`.
  const alt: unknown = props.alt;
  if (typeof alt !== 'string' || alt.trim() === '') {
    throw new TypeError(
      'Texte alternatif vide : décrire l’image dans `alt`, ou passer `decorative` si elle est ' +
        'purement décorative.',
    );
  }
  return alt;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const hasMetadata = (value: Record<string, unknown>): boolean =>
  typeof value['src'] === 'string' &&
  typeof value['width'] === 'number' &&
  typeof value['height'] === 'number' &&
  typeof value['format'] === 'string';

/** Exige une image locale importée (`import photo from './photo.jpg'`), jamais une URL. */
export function assertLocal(src: unknown): asserts src is ImageMetadata {
  if (typeof src === 'string') {
    throw new TypeError(
      `Image distante refusée (${src}) : importer un fichier local pour qu’Astro l’optimise.`,
    );
  }
  if (!isRecord(src) || !hasMetadata(src)) {
    throw new TypeError(
      'Image invalide : métadonnées attendues (src, width, height, format), issues d’un import.',
    );
  }
}

/** Propriété posée par Astro 7.4 (`createImageAsset`), non énumérable : absente du type public. */
type WithFsPath = ImageMetadata & { readonly fsPath?: unknown };

/** Chemin disque de l'image source, ou `undefined` si Astro ne l'a pas fourni. */
export function imagePath(src: ImageMetadata): string | undefined {
  const { fsPath } = src as WithFsPath;
  return typeof fsPath === 'string' && fsPath !== '' ? fsPath : undefined;
}
