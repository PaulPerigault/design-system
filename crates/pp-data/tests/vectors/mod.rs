//! Lecture des vecteurs de parité (`parity.json`, produit par `tools/data/build.mjs`).
use pp_data::DataError;
use serde_json::Value;

const VECTORS: &str = include_str!("parity.json");
/// Seuil de l'ADR-0007 sur les quantiles : écart relatif (confirmé en V4a, D-097).
pub const TOLERANCE: f64 = 1e-9;

pub fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("parity.json est du JSON valide")
}

pub fn cases<'a>(vectors: &'a Value, key: &str) -> &'a [Value] {
    vectors[key].as_array().expect("liste de cas")
}

/// JSON n'a ni `NaN` ni infini : le générateur les écrit `null`, relu ici comme `NaN`.
pub fn number(value: &Value) -> f64 {
    value.as_f64().unwrap_or(f64::NAN)
}

pub fn numbers(value: &Value) -> Vec<f64> {
    value
        .as_array()
        .expect("liste attendue")
        .iter()
        .map(number)
        .collect()
}

/// Valeurs d'une série à trous : `null` = donnée manquante.
pub fn optional_numbers(value: &Value) -> Vec<Option<f64>> {
    value
        .as_array()
        .expect("liste attendue")
        .iter()
        .map(Value::as_f64)
        .collect()
}

pub fn indices(value: &Value) -> Vec<usize> {
    value
        .as_array()
        .expect("liste attendue")
        .iter()
        .map(|index| usize::try_from(index.as_u64().expect("entier")).expect("indice"))
        .collect()
}

/// Code d'erreur TypeScript équivalent à chaque variante.
pub fn code(error: DataError) -> &'static str {
    match error {
        DataError::EmptyInput => "stats.empty",
        DataError::NonFiniteValue => "stats.non-finite",
        DataError::BadProbability => "stats.bad-probability",
        DataError::LengthMismatch | DataError::NonFiniteAbscissa => "geometry.bad-input",
        DataError::BadTarget => "downsample.bad-target",
        DataError::BadDate => "dataset.bad-date",
        DataError::TooManyPoints => "dataset.too-many-points",
    }
}

/// Code d'erreur TypeScript de `aggregate` : ses causes portent des codes `dataset.*`.
pub fn aggregate_code(error: DataError) -> &'static str {
    match error {
        DataError::EmptyInput => "dataset.empty",
        DataError::NonFiniteValue => "dataset.non-finite",
        DataError::LengthMismatch => "dataset.length-mismatch",
        other => code(other),
    }
}

/// Valeur d'une série d'agrégation : « NaN » et « Infinity » sont écrits en texte.
pub fn series_value(value: &Value) -> Option<f64> {
    match value {
        Value::String(text) => text.parse().ok(),
        other => other.as_f64(),
    }
}

/// Écart relatif : |a - b| / max(|a|, |b|), nul si les deux sont nuls.
pub fn relative_gap(actual: f64, expected: f64) -> f64 {
    let scale = actual.abs().max(expected.abs());
    if scale > 0.0 {
        (actual - expected).abs() / scale
    } else {
        0.0
    }
}
