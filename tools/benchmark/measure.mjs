// Mesures exécutées dans la page observée (fonctions autonomes, passées à page.evaluate).

/** Cibles interactives visibles dans la fenêtre : part ≥ 44 px, ≥ 24 px, médiane du petit côté. */
export function targets() {
  const selector = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button]';
  const sizes = [...document.querySelectorAll(selector)]
    .map((el) => el.getBoundingClientRect())
    .filter((r) => r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0)
    .map((r) => Math.min(r.width, r.height))
    .sort((a, b) => a - b);
  const share = (min) => (sizes.length ? sizes.filter((s) => s >= min).length / sizes.length : 0);
  return {
    count: sizes.length,
    atLeast44: Math.round(share(44) * 100),
    atLeast24: Math.round(share(24) * 100),
    median: sizes.length ? Math.round(sizes[Math.floor(sizes.length / 2)]) : null,
  };
}

/** Corps de texte : paragraphe de plus de 80 caractères le plus fréquent ; taille, interligne, CPL. */
export function bodyText() {
  const CONSENT =
    /cookie|consent|accepter|accept all|tout accepter|confidentialit|privacy|rgpd|gdpr/i;
  const isConsent = (el) => {
    const box = el.closest(
      '[role=dialog], [aria-modal=true], [id*=consent i], [class*=consent i], [id*=cookie i], [class*=cookie i]',
    );
    return Boolean(box) && CONSENT.test(box.textContent ?? '');
  };
  const paragraphs = [...document.querySelectorAll('main p, article p, p')].filter(
    (p) =>
      (p.textContent ?? '').trim().length > 80 &&
      p.getBoundingClientRect().width > 0 &&
      !isConsent(p),
  );
  if (paragraphs.length === 0) return null;
  const p = paragraphs[0];
  const style = getComputedStyle(p);
  const range = document.createRange();
  range.selectNodeContents(p);
  const lines = new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size || 1;
  const chars = (p.textContent ?? '').trim().length;
  return {
    fontSize: parseFloat(style.fontSize),
    lineHeight: style.lineHeight,
    charsPerLine: lines > 1 ? Math.round(chars / lines) : null,
  };
}

/** Navigation et chrome : barre fixe en bas, en-tête collant, bouton de menu, viewport-fit. */
export function chrome() {
  const CONSENT =
    /cookie|consent|accepter|accept all|tout accepter|confidentialit|privacy|rgpd|gdpr/i;
  const isConsent = (el) => {
    const box = el.closest(
      '[role=dialog], [aria-modal=true], [id*=consent i], [class*=consent i], [id*=cookie i], [class*=cookie i]',
    );
    return Boolean(box) && CONSENT.test(box.textContent ?? '');
  };
  const fixed = [...document.querySelectorAll('body *')].filter((el) => {
    const { position } = getComputedStyle(el);
    const pinned = position === 'fixed' || position === 'sticky';
    return pinned && el.getBoundingClientRect().height > 0 && !isConsent(el);
  });
  const rect = (el) => el.getBoundingClientRect();
  const viewport = document.querySelector('meta[name=viewport]')?.getAttribute('content') ?? '';
  return {
    bottomBar: fixed.some(
      (el) => rect(el).bottom >= innerHeight - 2 && el.querySelector('a, button'),
    ),
    stickyHeader: fixed.some((el) => rect(el).top <= 0 && rect(el).height < innerHeight / 3),
    menuButton: Boolean(
      document.querySelector(
        'button[aria-expanded], [aria-label*="menu" i], [aria-controls*="menu" i]',
      ),
    ),
    viewportFitCover: /viewport-fit\s*=\s*cover/.test(viewport),
    userScalableBlocked: /user-scalable\s*=\s*(no|0)|maximum-scale\s*=\s*1(\.0)?\b/.test(viewport),
  };
}

/** Focus clavier : après une tabulation, l'élément focalisé a-t-il un indicateur visible ? */
export function focusVisible() {
  const el = document.activeElement;
  if (!el || el === document.body) return null;
  const style = getComputedStyle(el);
  const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
  return { tag: el.tagName, outline, boxShadow: style.boxShadow !== 'none' };
}

/** Requêtes et polices (Resource Timing). */
export function resources() {
  const entries = performance.getEntriesByType('resource');
  const fonts = entries.filter((e) => /\.(woff2?|ttf|otf)(\?|$)/.test(e.name));
  return {
    requests: entries.length + 1,
    fontFiles: fonts.length,
    // transferSize vaut 0 sans Timing-Allow-Origin : poids inconnu plutôt que nul.
    fontKB: fonts.some((e) => e.transferSize === 0)
      ? null
      : Math.round(fonts.reduce((sum, e) => sum + e.transferSize, 0) / 1024),
  };
}

/** Fonds de `html` et de `body` (comparés en clair et en sombre). */
export const background = () =>
  [document.documentElement, document.body]
    .map((el) => getComputedStyle(el).backgroundColor)
    .join(' ');
