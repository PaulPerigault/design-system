/**
 * L'audit sert la doc en http sur l'hôte local. WebKit y applique `upgrade-insecure-requests`
 * (Chromium et Firefox exemptent l'hôte local) et réécrit alors toutes les ressources en https :
 * la page ne charge rien. La directive est retirée de la CSP servie à l'audit seulement.
 */
const UPGRADE = /;?\s*upgrade-insecure-requests/g;

export function forLocalHttp(headers: Record<string, string>): void {
  const csp = headers['Content-Security-Policy'];
  if (csp) headers['Content-Security-Policy'] = csp.replace(UPGRADE, '');
}
