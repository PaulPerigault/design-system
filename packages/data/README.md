# @paulperigault/data

`pp-data` (agrégation, quantiles de type 7, sous-échantillonnage LTTB) compilé en WebAssembly,
avec une enveloppe TypeScript. Statut : en construction (0.0.0, non publié).

Le TypeScript de `@paulperigault/dataviz` reste la référence : ce paquet ne remplace aucun de ses
appels tant que la parité n'est pas établie en CI. Le rendu des graphiques n'en dépend pas : il
fonctionne sans ce paquet. Décisions : ADR-0006 (décision 4), ADR-0007 (décision 1), D-099, D-100.

## Usage

```ts
import { createWasmAggregator, init, lttb, quantile } from '@paulperigault/data';

const ready = await init(); // charge et instancie le .wasm, une seule fois ; ne lève jamais
if (!ready.ok) throw new Error(ready.error.message); // data.load-failed

quantile([4, 8, 15, 16, 23, 42], 0.5); // { ok: true, value: 15.5 }
lttb(xs, values, 100); // { ok: true, value: [0, 7, …] } : indices à garder
createWasmAggregator().aggregate(dataset, { by: 'month', operation: 'sum' }); // port Aggregator
```

Toutes les fonctions rendent un `Result` de `dataviz` (`ok` ou `error.code`), jamais de `throw`.
Avant `init()`, elles rendent `data.not-ready`. Mêmes règles et mêmes codes que la référence :
`stats.*` (quantiles), `geometry.bad-input` et `downsample.bad-target` (LTTB), `dataset.*` et
`aggregate.*` (agrégation).

## Écarts de contrat

| Cas                                    | Référence TypeScript    | Ce paquet                                    |
| -------------------------------------- | ----------------------- | -------------------------------------------- |
| plus de 100 000 points                 | `lttb` : aucun contrôle | `dataset.too-many-points`                    |
| ordonnée `NaN` ou infinie dans `lttb`  | acceptée (sans sens)    | `dataset.non-finite`                         |
| cible `lttb` au-delà de 2³² − 1        | acceptée                | `downsample.bad-target`                      |
| groupe sans valeur dans une agrégation | `null`                  | `null` (le `.wasm` rend `NaN`, converti ici) |

Le `.wasm` ne panique jamais : `pp-data` rend toujours un `Result`.

## Construction

Le `.wasm` n'est jamais commité : la CI le produit (`npm run build:wasm`, job `wasm`), avec
`cargo`, la cible `wasm32-unknown-unknown` et `wasm-bindgen` 0.2.130. `npm run check:wasm`
vérifie l'empreinte SHA-256 enregistrée dans `wasm/pp_data_wasm_bg.wasm.sha256` (format
`sha256sum`), publiée avec le paquet. `npm run measure` affiche le poids et le temps de chargement,
sans seuil bloquant.

`init()` lit le fichier de façon synchrone sous Node et par `fetch` ailleurs, à l'adresse
`../wasm/pp_data_wasm_bg.wasm` relative au module. Le glue est chargé par une URL calculée : un
bundleur doit copier le dossier `wasm/` (ou ne pas le traiter). Sous CSP, le navigateur n'exige que
`'wasm-unsafe-eval'` dans `script-src` et `'self'` dans `connect-src`.
