// Bouton « Mettre à jour » : envoie SKIP_WAITING au worker en attente puis recharge la page.
/* global document, location */
const LABEL = 'Mettre à jour';

function show(worker) {
  const box = document.createElement('div');
  const button = document.createElement('button');
  box.setAttribute('role', 'status');
  button.type = 'button';
  button.className = 'pp-pwa-update';
  button.textContent = LABEL;
  button.addEventListener('click', () => worker.postMessage({ type: 'SKIP_WAITING' }));
  box.append(button);
  document.body.append(box);
}

export function offer(registration, sw) {
  sw.addEventListener('controllerchange', () => location.reload());
  if (registration.waiting) return show(registration.waiting);
  const worker = registration.installing;
  worker?.addEventListener('statechange', () => {
    if (worker.state === 'installed') show(worker);
  });
}
