//! Constantes nommées et conversions numériques, seuls endroits où l'on utilise `as`.

/// Nombre maximal de points d'une série (`MAX_POINTS` du contrat `Dataset`, ADR-0007) : en deçà,
/// les indices restent exacts en `f64` et aucun calcul d'indice ne déborde.
pub const MAX_POINTS: usize = 100_000;
/// Le premier et le dernier point d'une suite, ou l'intervalle d'un seau.
pub(crate) const PAIR: usize = 2;

/// Un entier d'au plus `MAX_POINTS` (plus quelques unités) est exact en `f64`.
#[allow(
    clippy::cast_precision_loss,
    reason = "les indices sont bornés par MAX_POINTS, bien en deçà de 2^53"
)]
pub(crate) fn to_f64(count: usize) -> f64 {
    count as f64
}

/// Partie entière d'un réel positif ou nul ; `as` sature (NaN et négatif donnent 0), sans panic.
#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss,
    reason = "la valeur est un indice positif borné par MAX_POINTS, `as` sature sinon"
)]
pub(crate) fn floor_index(value: f64) -> usize {
    value.floor() as usize
}
