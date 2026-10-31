//! Parité avec la référence TypeScript (`packages/dataviz`), ADR-0007 décision 1 : quantiles à
//! 1e-9 près en relatif, indices LTTB identiques. Les vecteurs sont produits par
//! `tools/data/build.mjs` ; la CI vérifie qu'ils sont à jour (`check:data-vectors`).
mod vectors;

use pp_data::{lttb, quantile, quantiles};
use vectors::{TOLERANCE, cases, code, indices, numbers, optional_numbers, relative_gap, vectors};

#[test]
fn quantiles_match_reference() {
    let vectors = vectors();
    let mut worst = 0.0_f64;
    for case in cases(&vectors, "quantiles") {
        let name = &case["name"];
        let (values, probabilities) = (numbers(&case["values"]), numbers(&case["probabilities"]));
        let actual = quantiles(&values, &probabilities);
        if let Some(error) = case["error"].as_str() {
            assert_eq!(actual.map_err(code), Err(error), "{name} : erreur");
            continue;
        }
        let actual = actual.expect("quantiles valides");
        let expected = numbers(&case["expected"]);
        assert_eq!(actual.len(), expected.len(), "{name} : longueur");
        for ((got, want), p) in actual.iter().zip(&expected).zip(&probabilities) {
            worst = worst.max(relative_gap(*got, *want));
            assert_eq!(
                quantile(&values, *p).as_ref(),
                Ok(got),
                "{name} : quantile seul"
            );
        }
    }
    eprintln!("écart relatif maximal des quantiles : {worst:e}");
    assert!(worst <= TOLERANCE, "écart {worst:e} > {TOLERANCE:e}");
}

#[test]
fn lttb_matches_reference() {
    let vectors = vectors();
    let list = cases(&vectors, "lttb");
    assert!(list.len() >= 19, "jeu de cas trop court : {}", list.len());
    for case in list {
        let name = &case["name"];
        let (xs, values) = (numbers(&case["xs"]), optional_numbers(&case["values"]));
        // Une cible non entière (`2.5`) n'existe pas en `usize` : le TypeScript la refuse
        // (`downsample.bad-target`), ici elle devient 0, que `lttb` refuse aussi.
        let target = case["target"]
            .as_u64()
            .and_then(|t| usize::try_from(t).ok());
        let actual = lttb(&xs, &values, target.unwrap_or(0));
        match case["error"].as_str() {
            Some(error) => assert_eq!(actual.map_err(code), Err(error), "{name} : erreur"),
            None => assert_eq!(actual, Ok(indices(&case["expected"])), "{name} : indices"),
        }
    }
}
