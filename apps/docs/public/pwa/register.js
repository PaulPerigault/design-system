// Enregistre le service worker et propose la mise à jour. Aucun stockage, aucun réseau tiers.
/* global navigator, document, location */
if ('serviceWorker' in navigator) {
  const sw = navigator.serviceWorker;
  const hadController = Boolean(sw.controller);
  const showUpdate = (worker) => {
    const box = document.createElement('div');
    const button = document.createElement('button');
    box.setAttribute('role', 'status');
    button.type = 'button';
    button.className = 'pp-pwa-update';
    button.textContent = 'Mettre à jour';
    button.addEventListener('click', () => worker.postMessage({ type: 'SKIP_WAITING' }));
    box.append(button);
    document.body.append(box);
  };
  const watch = (registration) => {
    if (registration.waiting) showUpdate(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      worker?.addEventListener('statechange', () => {
        if (worker.state === 'installed' && sw.controller) showUpdate(worker);
      });
    });
  };
  sw.addEventListener('controllerchange', () => hadController && location.reload());
  sw.register('/sw.js').then(watch, () => undefined);
}
