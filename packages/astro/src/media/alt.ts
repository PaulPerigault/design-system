import type { AltProps } from './types';

/** Extrait `alt` ou `decorative` pour le transmettre tel quel à `Photo` (union conservée). */
export const altPropsOf = (props: AltProps): AltProps =>
  props.decorative === true ? { decorative: true } : { alt: props.alt };
