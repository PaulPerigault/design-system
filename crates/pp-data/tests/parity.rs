//! Parité avec la référence TypeScript (`packages/dataviz`), ADR-0007 décision 1 : quantiles à
//! 1e-9 près en relatif, indices LTTB identiques. Les vecteurs sont produits par
//! `tools/data/build.mjs` ; la CI vérifie qu'ils sont à jour (`check:data-vectors`).
mod vectors;

use pp_data::{GroupBy, Operation, aggregate, lttb, quantile, quantiles};
use vectors::{
    TOLERANCE, aggregate_code, cases, code, indices, numbers, optional_numbers, relative_gap,
    series_value, vectors,
};

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

fn operation_of(name: &str) -> Operation {
    match name {
        "sum" => Operation::Sum,
        "mean" => Operation::Mean,
        "min" => Operation::Min,
        "max" => Operation::Max,
        "count" => Operation::Count,
        "first" => Operation::First,
        "last" => Operation::Last,
        other => panic!("opération inconnue : {other}"),
    }
}

fn grouping_of(name: &str) -> GroupBy {
    match name {
        "category" => GroupBy::Category,
        "day" => GroupBy::Day,
        "month" => GroupBy::Month,
        "year" => GroupBy::Year,
        other => panic!("regroupement inconnu : {other}"),
    }
}

fn strings(value: &serde_json::Value) -> Vec<String> {
    let list = value.as_array().expect("liste attendue");
    list.iter()
        .map(|text| text.as_str().expect("texte").to_owned())
        .collect()
}

fn rows(value: &serde_json::Value) -> Vec<Vec<Option<f64>>> {
    let list = value.as_array().expect("liste attendue");
    list.iter()
        .map(|row| {
            row.as_array()
                .expect("série")
                .iter()
                .map(series_value)
                .collect()
        })
        .collect()
}

#[test]
fn aggregates_match_reference() {
    let vectors = vectors();
    let list = cases(&vectors, "aggregates");
    assert!(list.len() >= 50, "jeu de cas trop court : {}", list.len());
    let mut worst = 0.0_f64;
    for case in list {
        let name = &case["name"];
        let (by, operation) = (
            grouping_of(case["by"].as_str().expect("by")),
            operation_of(case["operation"].as_str().expect("operation")),
        );
        let actual = aggregate(&strings(&case["x"]), &rows(&case["series"]), by, operation);
        if let Some(error) = case["error"].as_str() {
            assert_eq!(
                actual.map_err(aggregate_code),
                Err(error),
                "{name} : erreur"
            );
            continue;
        }
        let actual = actual.expect("agrégation valide");
        let expected = &case["expected"];
        assert_eq!(
            actual.labels,
            strings(&expected["labels"]),
            "{name} : groupes"
        );
        let want = rows(&expected["series"]);
        assert_eq!(actual.series.len(), want.len(), "{name} : séries");
        for (got, want) in actual.series.iter().flatten().zip(want.iter().flatten()) {
            match (got, want) {
                (Some(got), Some(want)) => worst = worst.max(relative_gap(*got, *want)),
                (None, None) => {}
                _ => panic!("{name} : manquant contre valeur ({got:?} contre {want:?})"),
            }
        }
    }
    eprintln!("écart relatif maximal des agrégations : {worst:e}");
    assert!(worst <= TOLERANCE, "écart {worst:e} > {TOLERANCE:e}");
}
