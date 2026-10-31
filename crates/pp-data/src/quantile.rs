//! Quantiles de type 7 (Hyndman et Fan, 1996, « Sample quantiles in statistical packages », The
//! American Statistician 50(4)) : défaut de R et de `NumPy`, interpolation linéaire entre les deux
//! valeurs triées qui encadrent la position (n - 1) p. Même définition que `quantile.ts`.
use crate::error::DataError;
use crate::numbers::{MAX_POINTS, floor_index, to_f64};

/// Copie triée des valeurs, ou l'erreur d'une suite vide, trop longue ou non finie.
fn sorted_finite(values: &[f64]) -> Result<Vec<f64>, DataError> {
    if values.is_empty() {
        return Err(DataError::EmptyInput);
    }
    if values.len() > MAX_POINTS {
        return Err(DataError::TooManyPoints);
    }
    if !values.iter().all(|value| value.is_finite()) {
        return Err(DataError::NonFiniteValue);
    }
    let mut sorted = values.to_vec();
    sorted.sort_by(f64::total_cmp);
    Ok(sorted)
}

fn is_probability(p: f64) -> bool {
    p.is_finite() && (0.0..=1.0).contains(&p)
}

/// Q(p) = (1 - γ) x[j] + γ x[j + 1], avec h = (n - 1) p, j = ⌊h⌋ et γ = h - j (suite triée, non vide).
fn at_probability(sorted: &[f64], p: f64) -> f64 {
    let last = sorted.len().saturating_sub(1);
    let position = to_f64(last) * p;
    let below = floor_index(position);
    let weight = position - position.floor();
    let lower = sorted.get(below).copied().unwrap_or(f64::NAN);
    let upper = sorted
        .get(below.saturating_add(1).min(last))
        .copied()
        .unwrap_or(lower);
    (1.0 - weight) * lower + weight * upper
}

/// Quantiles de type 7 de `values` pour chaque probabilité, avec un seul tri.
///
/// # Errors
///
/// `EmptyInput` si `values` est vide, `TooManyPoints` au-delà de `MAX_POINTS`, `NonFiniteValue` si
/// une valeur n'est pas finie, `BadProbability` si une probabilité sort de [0, 1]. Les valeurs sont
/// contrôlées avant les probabilités, comme en TypeScript.
pub fn quantiles(values: &[f64], probabilities: &[f64]) -> Result<Vec<f64>, DataError> {
    let sorted = sorted_finite(values)?;
    if !probabilities.iter().all(|p| is_probability(*p)) {
        return Err(DataError::BadProbability);
    }
    Ok(probabilities
        .iter()
        .map(|p| at_probability(&sorted, *p))
        .collect())
}

/// Un seul quantile de type 7 ; voir [`quantiles`].
///
/// # Errors
///
/// Les mêmes que [`quantiles`].
pub fn quantile(values: &[f64], p: f64) -> Result<f64, DataError> {
    quantiles(values, &[p])?
        .first()
        .copied()
        .ok_or(DataError::EmptyInput)
}
