// Enregistre le service worker. Le bouton de mise à jour (update.js) ne se charge que si un
// worker neuf attend alors qu'un ancien contrôle déjà la page. Aucun stockage, aucun réseau tiers.
/* global navigator */
const sw = navigator.serviceWorker;
const ask = (registration) => import('/pwa/update.js').then((m) => m.offer(registration, sw));
sw?.register('/sw.js').then(
  (registration) => {
    if (sw.controller && registration.waiting) ask(registration);
    registration.addEventListener('updatefound', () => sw.controller && ask(registration));
  },
  () => undefined,
);
