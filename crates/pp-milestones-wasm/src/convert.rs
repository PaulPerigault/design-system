//! Conversions de frontière partagées.
use wasm_bindgen::JsValue;

/// Résultat rendu à JavaScript : l'erreur est un code littéral (`fault::raise`).
pub type Out<T> = Result<T, JsValue>;

/// Millisecondes relatives (depuis la création de la scène) : `f32` suffit pour un écart de durée.
#[allow(
    clippy::cast_possible_truncation,
    reason = "millisecondes relatives : f32 suffit"
)]
#[must_use]
pub fn ms(now: f64) -> f32 {
    now as f32
}
