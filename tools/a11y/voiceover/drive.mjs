// Pilote VoiceOver pour une page (Guidepup). NON TESTÉ SUR macOS : écrit sous Windows, vérifié
// seulement avec de faux objets. Dépendances injectées : `voiceOver` (Guidepup), `open`, `wait`.
export const DEFAULT_STEPS = 120;

/**
 * Ouvre la page, démarre VoiceOver, avance de `steps` éléments et rend le texte prononcé.
 * VoiceOver est toujours arrêté, même en cas d'erreur.
 * @returns {Promise<string[]>} phrases prononcées, dans l'ordre
 */
export async function listen(url, { voiceOver, open, wait, steps = DEFAULT_STEPS }) {
  await open(url);
  await wait();
  await voiceOver.start();
  try {
    for (let i = 0; i < steps; i += 1) await voiceOver.next();
    return await voiceOver.spokenPhraseLog();
  } finally {
    await voiceOver.stop();
  }
}

/** Texte prononcé de chaque page : `Map` page → phrases (une page en erreur donne une liste vide). */
export async function listenAll(base, pages, tools, onError = () => {}) {
  const spoken = new Map();
  for (const page of pages) {
    try {
      spoken.set(page, await listen(`${base}${page}`, tools));
    } catch (error) {
      onError(page, error);
      spoken.set(page, []);
    }
  }
  return spoken;
}
