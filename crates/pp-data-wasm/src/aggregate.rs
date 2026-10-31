//! Agrégation : délègue à `pp-data`.
use crate::fault::Fault;
use crate::input::{grouping, operation, series_of};
use wasm_bindgen::prelude::wasm_bindgen;

/// Résultat remis à JavaScript : les libellés des groupes, et les valeurs à plat (série après série,
/// un point par groupe). Un groupe sans valeur est `NaN` ici ; l'enveloppe TypeScript en fait `null`
/// (`pp-data` ne rend jamais `NaN` autrement : toute entrée non finie est refusée).
#[wasm_bindgen]
pub struct Aggregation {
    labels: Vec<String>,
    values: Vec<f64>,
}

#[wasm_bindgen]
impl Aggregation {
    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn labels(&self) -> Vec<String> {
        self.labels.clone()
    }

    #[wasm_bindgen(getter)]
    #[must_use]
    pub fn values(&self) -> Vec<f64> {
        self.values.clone()
    }
}

/// Agrège `values` (séries à plat, `labels.len()` points chacune) par `by` avec `operation`.
///
/// # Errors
///
/// Les erreurs de `pp_data::aggregate`, ou `bad-argument` pour un nom inconnu ou des longueurs
/// incohérentes.
#[wasm_bindgen]
#[allow(
    clippy::needless_pass_by_value,
    reason = "wasm-bindgen reçoit des textes en `Vec<String>`, pas en `&[String]`"
)]
pub fn aggregate(
    labels: Vec<String>,
    values: &[f64],
    missing: &[u8],
    by: &str,
    operation_name: &str,
) -> Result<Aggregation, Fault> {
    let series = series_of(values, missing, labels.len())?;
    let result = pp_data::aggregate(&labels, &series, grouping(by)?, operation(operation_name)?)?;
    let values = result
        .series
        .into_iter()
        .flatten()
        .map(|value| value.unwrap_or(f64::NAN))
        .collect();
    Ok(Aggregation {
        labels: result.labels,
        values,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use pp_data::DataError;

    fn texts(items: &[&str]) -> Vec<String> {
        items.iter().map(|item| (*item).to_owned()).collect()
    }

    #[test]
    fn flattens_series_and_marks_empty_groups_as_nan() {
        let labels = texts(&["a", "b", "a", "b"]);
        let result = aggregate(
            labels,
            &[1.0, 0.0, 2.0, 0.0, 5.0, 6.0, 7.0, 8.0],
            &[0, 1, 0, 1, 0, 0, 0, 0],
            "category",
            "sum",
        )
        .unwrap();
        assert_eq!(result.labels(), texts(&["a", "b"]));
        let values = result.values();
        assert_eq!(values.first(), Some(&3.0));
        assert!(values.get(1).is_some_and(|value| value.is_nan()));
        assert_eq!(values.get(2..), Some([12.0, 14.0].as_slice()));
    }

    #[test]
    fn refuses_with_a_literal_cause() {
        let labels = texts(&["2026-02-30"]);
        let err = aggregate(labels, &[1.0], &[0], "day", "sum").err();
        assert_eq!(err, Some(DataError::BadDate.into()));
        let err = aggregate(texts(&["a"]), &[1.0], &[0], "week", "sum").err();
        assert_eq!(err, Some(Fault::BadArgument));
    }
}
