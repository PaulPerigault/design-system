//! Gamut sRGB : test et ramenée par réduction du chroma. Mêmes définitions que `inSrgbGamut`
//! (`color.ts`) et `fitToGamut` (`palette/domain/color/gamut.ts`).
use crate::convert::oklch_to_srgb;
use crate::error::{ColorError, Component, finite};
use crate::types::Oklch;

const DEFAULT_EPSILON: f64 = 1e-4;
const BISECTION_STEPS: u32 = 24;
const HALF: f64 = 0.5;

/// Vrai si chaque canal gamma est dans [-epsilon, 1 + epsilon], epsilon = 1e-4.
/// Une couleur dont la conversion déborde en infini n'est pas dans le gamut.
#[must_use]
pub fn in_srgb_gamut(color: Oklch) -> bool {
    within(color, DEFAULT_EPSILON)
}

/// Comme [`in_srgb_gamut`], avec une tolérance choisie.
///
/// # Errors
/// `NonFinite` si `epsilon` n'est pas fini ; `OutOfRange` s'il est négatif.
pub fn in_srgb_gamut_within(color: Oklch, epsilon: f64) -> Result<bool, ColorError> {
    if finite(epsilon, Component::Epsilon)? < 0.0 {
        return Err(ColorError::OutOfRange(Component::Epsilon));
    }
    Ok(within(color, epsilon))
}

fn within(color: Oklch, epsilon: f64) -> bool {
    oklch_to_srgb(color).is_ok_and(|srgb| {
        srgb.channels()
            .iter()
            .all(|value| *value >= -epsilon && *value <= 1.0 + epsilon)
    })
}

/// Réduit le chroma (clarté et teinte conservées) jusqu'à tenir dans sRGB : pas de rognage.
/// Dichotomie en 24 pas, comme la référence TypeScript.
#[must_use]
pub fn fit_to_gamut(color: Oklch) -> Oklch {
    if in_srgb_gamut(color) {
        return color;
    }
    let (mut low, mut high) = (0.0, color.chroma());
    for _ in 0..BISECTION_STEPS {
        let mid = (low + high) * HALF;
        match color.with_chroma(mid) {
            Ok(candidate) if in_srgb_gamut(candidate) => low = mid,
            _ => high = mid,
        }
    }
    // `low` reste dans [0, chroma d'origine] : le repli sur la couleur d'entrée est inatteignable.
    color.with_chroma(low).unwrap_or(color)
}
