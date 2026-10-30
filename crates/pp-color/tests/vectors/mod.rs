//! Lecture des vecteurs de parité (`parity.json`, produit par `tools/color/build.mjs`).
use crate::common::oklch;
use pp_color::Oklch;
use serde_json::Value;

const VECTORS: &str = include_str!("parity.json");
/// Seuil de l'ADR-0006 sur les composantes ; appliqué aussi au rapport brut et à Lc.
pub const TOLERANCE: f64 = 1e-6;

pub fn vectors() -> Value {
    serde_json::from_str(VECTORS).expect("parity.json est du JSON valide")
}

pub fn number(value: &Value) -> f64 {
    value.as_f64().expect("nombre attendu")
}

pub fn list(value: &Value) -> Vec<f64> {
    value
        .as_array()
        .expect("liste attendue")
        .iter()
        .map(number)
        .collect()
}

/// Couleur OKLCH d'un cas : champ `oklch` = `[l, c, h]`.
pub fn color_of(value: &Value) -> Oklch {
    let [l, c, h] = <[f64; 3]>::try_from(list(&value["oklch"])).expect("[l, c, h]");
    oklch(l, c, h)
}
