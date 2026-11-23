// Rend la main au navigateur entre deux étapes de l'initialisation : sans cela, le chargement du
// module, la création de la scène (shaders, tampons) et la première image forment une seule tâche
// longue sur un téléphone (mesure de l'audit #366 : tâche de 57 ms avec le processeur ralenti 4 fois).

interface Yielding {
  yield(): Promise<void>;
}

function canYield(value: unknown): value is Yielding {
  return (
    typeof value === 'object' &&
    value !== null &&
    'yield' in value &&
    typeof value.yield === 'function'
  );
}

/** `scheduler.yield()` quand il existe (tâche reprise en priorité), sinon un message de canal. */
export function yieldToMain(): Promise<void> {
  const scheduler: unknown = Reflect.get(globalThis, 'scheduler');
  if (canYield(scheduler)) return scheduler.yield();
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
  });
}

/** Attente maximale d'une image avant de reprendre quand elle ne vient pas (onglet masqué), en ms. */
const FRAME_FALLBACK_MS = 100;

/**
 * Reprend dans un rappel d'image (`requestAnimationFrame`), où la suite s'exécute juste avant le
 * calcul de mise en page de l'image : le composant qui reçoit la scène change alors le DOM et la
 * mise en page est faite par le cycle de rendu de cette image, au lieu d'être forcée par la lecture
 * de la première image de son propre rappel (tâche de 54 ms en CI, audit #394). La scène ne se
 * branche et ne trace qu'ensuite : le redimensionnement qui suit ce changement de mise en page ne
 * tombe plus pendant un tracé que le GPU logiciel n'a pas fini. Sans
 * `requestAnimationFrame` (Node) : `yieldToMain`. Un onglet masqué ne rend aucune image : délai.
 */
export function yieldToFrame(): Promise<void> {
  if (typeof globalThis.requestAnimationFrame !== 'function') return yieldToMain();
  return new Promise((resolve) => {
    let waiting = true;
    const resume = (): void => {
      if (waiting) resolve();
      waiting = false;
    };
    globalThis.requestAnimationFrame(resume);
    setTimeout(resume, FRAME_FALLBACK_MS);
  });
}
