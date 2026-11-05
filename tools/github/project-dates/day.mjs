// Jour civil (AAAA-MM-JJ) d'un instant ISO, à l'heure de Paris comme `docs/history/catch-up.md`.
const DAY = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Paris' });

export const parisDay = (iso) => DAY.format(new Date(iso));
