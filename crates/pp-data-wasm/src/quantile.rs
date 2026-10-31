//! Quantiles de type 7 : délègue à `pp-data`.
use crate::fault::Fault;
use wasm_bindgen::prelude::wasm_bindgen;

/// Un quantile par probabilité, avec un seul tri.
///
/// # Errors
///
/// Les erreurs de `pp_data::quantiles`, en chaîne littérale côté JavaScript.
#[wasm_bindgen]
pub fn quantiles(values: &[f64], probabilities: &[f64]) -> Result<Vec<f64>, Fault> {
    Ok(pp_data::quantiles(values, probabilities)?)
}

#[cfg(test)]
mod tests {
    use super::*;
    use pp_data::DataError;

    #[test]
    fn delegates_and_keeps_the_error() {
        assert_eq!(quantiles(&[1.0, 2.0, 3.0, 4.0], &[0.5]), Ok(vec![2.5]));
        assert_eq!(quantiles(&[], &[0.5]), Err(DataError::EmptyInput.into()));
    }
}
