import tokens from '@paulperigault/tokens/tokens.json';
import { SITE_LANG, SITE_NAME } from './site';

/** Manifeste d'application web (W3C Web Application Manifest), sérialisé par l'endpoint. */

export interface PwaSite {
  readonly name: string;
}

export interface ManifestIcon {
  readonly src: string;
  readonly sizes: string;
  readonly type: 'image/png';
  readonly purpose: 'any' | 'maskable';
}

export interface WebManifest {
  readonly id: string;
  readonly name: string;
  readonly short_name: string;
  readonly lang: string;
  readonly start_url: string;
  readonly scope: string;
  readonly display: 'standalone';
  readonly theme_color: string;
  readonly background_color: string;
  readonly icons: readonly ManifestIcon[];
}

export const ICON_DIR = '/pwa';
export const ICON_SMALL = 192;
export const ICON_LARGE = 512;

const icon = (file: string, size: number, purpose: ManifestIcon['purpose']): ManifestIcon => ({
  src: `${ICON_DIR}/${file}`,
  sizes: `${size}x${size}`,
  type: 'image/png',
  purpose,
});

export const MANIFEST_ICONS: readonly ManifestIcon[] = [
  icon('icon-192.png', ICON_SMALL, 'any'),
  icon('icon-512.png', ICON_LARGE, 'any'),
  icon('icon-maskable-512.png', ICON_LARGE, 'maskable'),
];

/** Construit le manifeste ; les couleurs viennent des jetons (`themeColor.light`). */
export function buildManifest(site: PwaSite = { name: SITE_NAME }): WebManifest {
  const color = tokens.themeColor.light;
  return {
    id: '/',
    name: site.name,
    short_name: site.name,
    lang: SITE_LANG,
    start_url: '/',
    scope: '/',
    display: 'standalone',
    theme_color: color,
    background_color: color,
    icons: MANIFEST_ICONS,
  };
}
