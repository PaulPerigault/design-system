//! Conversions OKLCH ↔ sRGB linéaire ↔ sRGB. Formules : CSS Color Module Level 4 (W3C),
//! § 9 (Oklab, `OkLCh`) et § 10.2 (sRGB) ; mêmes définitions que `packages/tokens/src/lib/color.ts`.
use crate::error::ColorError;
use crate::matrices::{self, Vec3};
use crate::transfer::{gamma_to_linear, linear_to_gamma};
use crate::types::{LinearSrgb, Oklch, Srgb};

const FULL_TURN_DEGREES: f64 = 360.0;
/// En deçà, gris : bruit d'arrondi des matrices (~4e-8).
const ACHROMATIC_CHROMA: f64 = 1e-6;

fn cube(vector: Vec3) -> Vec3 {
    vector.map(|value| value.powi(3))
}

/// OKLCH → Oklab → LMS → sRGB linéaire, sans rognage.
///
/// # Errors
/// `NonFinite` si la conversion déborde (chroma fini mais démesuré).
pub fn oklch_to_linear_srgb(color: Oklch) -> Result<LinearSrgb, ColorError> {
    let hue = color.hue().to_radians();
    let lab = [
        color.lightness(),
        color.chroma() * hue.cos(),
        color.chroma() * hue.sin(),
    ];
    let lms_prime = matrices::multiply(&matrices::OKLAB_TO_LMS_PRIME, lab);
    let [r, g, b] = matrices::multiply(&matrices::LMS_TO_LINEAR_SRGB, cube(lms_prime));
    LinearSrgb::new(r, g, b)
}

/// OKLCH → sRGB gamma, sans rognage : hors gamut, les canaux sortent de [0, 1].
///
/// # Errors
/// Voir [`oklch_to_linear_srgb`].
pub fn oklch_to_srgb(color: Oklch) -> Result<Srgb, ColorError> {
    let [r, g, b] = oklch_to_linear_srgb(color)?.channels().map(linear_to_gamma);
    Srgb::new(r, g, b)
}

/// sRGB gamma → OKLCH, teinte dans [0, 360), 0 pour un gris.
///
/// # Errors
/// `OutOfRange` si la clarté obtenue sort de [0, 1], ce qui n'arrive qu'à des canaux très
/// éloignés de [0, 1].
pub fn srgb_to_oklch(color: Srgb) -> Result<Oklch, ColorError> {
    let linear = color.channels().map(gamma_to_linear);
    let lms = matrices::multiply(&matrices::LINEAR_SRGB_TO_LMS, linear);
    let [l, a, b] = matrices::multiply(&matrices::LMS_PRIME_TO_OKLAB, lms.map(f64::cbrt));
    let chroma = a.hypot(b);
    if chroma < ACHROMATIC_CHROMA {
        return Oklch::new(l, 0.0, 0.0);
    }
    let hue = b.atan2(a).to_degrees();
    Oklch::new(l, chroma, (hue + FULL_TURN_DEGREES) % FULL_TURN_DEGREES)
}
