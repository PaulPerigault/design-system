// Condition d'export à nom propre : les tests lisent `src/` des paquets du dépôt, jamais `dist/`.
// Absente du paquet publié (D-075).
export const SOURCE_CONDITION = '@paulperigault/source';

export const sourceResolve = {
  resolve: { conditions: [SOURCE_CONDITION] },
  ssr: { resolve: { conditions: [SOURCE_CONDITION] } },
};
