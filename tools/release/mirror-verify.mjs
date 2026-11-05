// Miroir GitHub Packages : contrôle de présence final, après la publication.
import { RegistryError, waitFor } from './mirror-registry.mjs';

/**
 * Chaque version publique attendue doit être sur GitHub Packages (version exacte, API REST).
 * Une réponse inattendue (403 : le GITHUB_TOKEN ne liste peut-être pas les versions) devient une
 * ligne d'échec qui porte le code HTTP ; toute autre erreur remonte.
 * @returns {Promise<string[]>} lignes d'échec, vide si tout est présent
 */
export async function verifyOnGithub(specs, has, wait) {
  try {
    const { missing } = await waitFor(specs, has, wait);
    return missing.map((spec) => `${spec} : absent de GitHub Packages après publication`);
  } catch (error) {
    if (!(error instanceof RegistryError)) throw error;
    return [`contrôle de présence final impossible : ${error.message}`];
  }
}
