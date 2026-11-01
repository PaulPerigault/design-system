// Estimation du carbone d'une page vue (#102), modèle Sustainable Web Design v4.
// Source : https://sustainablewebdesign.org/estimating-digital-emissions/ (page lue le 2026-11-01).
// C'est une estimation par un modèle descendant, jamais une mesure : voir la page « Sobriété ».
const BYTES_PER_GB = 1e9;

/** kWh par Go, opérationnel (`operational`) et incorporé (`embodied`), par segment du modèle. */
export const SEGMENTS = {
  dataCenters: { operational: 0.055, embodied: 0.012 },
  networks: { operational: 0.059, embodied: 0.013 },
  devices: { operational: 0.08, embodied: 0.081 },
};
/** Intensité du réseau électrique mondial du modèle, en gCO2e par kWh. */
export const GRID_INTENSITY = 494;

export const SCENARIOS = {
  newVisitor: { returnRatio: 0, cacheRatio: 0, greenHosting: 0 },
  returnVisitor: { returnRatio: 1, cacheRatio: 0.5, greenHosting: 0 },
};

/** Émissions (gCO2e) d'un transfert de `bytes` octets pour un visiteur, par segment. */
function perVisit(bytes, greenHosting) {
  const gigabytes = bytes / BYTES_PER_GB;
  const grams = (segment, green) =>
    gigabytes * (segment.operational * (1 - green) + segment.embodied) * GRID_INTENSITY;
  return Object.values(SEGMENTS).map((segment, index) =>
    grams(segment, index === 0 ? greenHosting : 0),
  );
}

/**
 * Émissions moyennes d'une page vue (gCO2e) : nouveaux visiteurs plein poids, visiteurs de retour
 * au poids non mis en cache (formule complète du modèle).
 * @param {number} bytes octets transférés (compressés)
 */
export function pageViewGrams(bytes, { returnRatio, cacheRatio, greenHosting }) {
  const full = perVisit(bytes, greenHosting).reduce((all, value) => all + value, 0);
  return full * (1 - returnRatio) + full * returnRatio * (1 - cacheRatio);
}
