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
