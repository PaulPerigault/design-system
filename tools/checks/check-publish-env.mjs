// Garde `prepublishOnly` de chaque paquet : une publication n'est admise que depuis GitHub Actions,
// avec un jeton OIDC disponible (trusted publishing). En local, même avec un jeton npm, c'est refusé.

/**
 * @param {Record<string, string | undefined>} env variables d'environnement
 * @returns {string | null} raison du refus, ou null si la publication est admise
 */
export function publishRefusal(env) {
  if (env.GITHUB_ACTIONS !== 'true') {
    return 'Publication refusée : seul le workflow release de GitHub Actions publie.';
  }
  if (!env.ACTIONS_ID_TOKEN_REQUEST_URL || !env.ACTIONS_ID_TOKEN_REQUEST_TOKEN) {
    return 'Publication refusée : aucun jeton OIDC (permissions: id-token: write manquante).';
  }
  return null;
}

if (import.meta.main) {
  const reason = publishRefusal(process.env);
  if (reason) {
    console.error(reason);
    process.exit(1);
  }
}
