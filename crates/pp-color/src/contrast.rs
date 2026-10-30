//! Contraste WCAG 2 : luminance relative et rapport, de 1 à 21. Mêmes définitions que
//! `relativeLuminance` et `contrastRatio` (`packages/tokens/src/lib/contrast.ts`), calculées sur la
//! couleur sRGB rendue (gamma), jamais sur la clarté d'OKLCH.
use crate::convert::oklch_to_srgb;
use crate::error::{ColorError, Component};
use crate::gamut::in_srgb_gamut;
use crate::transfer::gamma_to_linear;
use crate::types::{Oklch, Srgb};

// WCAG 2.2 (W3C, 2023), « relative luminance » et « contrast ratio ». Linéarisation par la
// fonction de transfert IEC 61966-2-1 (seuil 0,04045), comme la référence TypeScript.
const RED: f64 = 0.2126;
const GREEN: f64 = 0.7152;
const BLUE: f64 = 0.0722;
const FLARE: f64 = 0.05;

/// Canaux d'une couleur sRGB, refusés s'ils sortent de [0, 1] : le contraste n'est défini que
/// pour une couleur rendue, et une puissance d'un canal négatif donnerait `NaN`.
pub(crate) fn unit_channels(color: Srgb) -> Result<[f64; 3], ColorError> {
    let [r, g, b] = color.channels();
    let checks = [
        (r, Component::Red),
        (g, Component::Green),
        (b, Component::Blue),
    ];
    for (value, component) in checks {
        if !(0.0..=1.0).contains(&value) {
            return Err(ColorError::OutOfRange(component));
        }
    }
    Ok([r, g, b])
}

/// Couleur sRGB rendue d'un OKLCH : refus hors gamut, bruit d'arrondi ramené dans [0, 1].
///
/// # Errors
/// `OutOfGamut` si la couleur sort du gamut sRGB ; sinon voir [`oklch_to_srgb`].
pub fn rendered_srgb(color: Oklch) -> Result<Srgb, ColorError> {
    if !in_srgb_gamut(color) {
        return Err(ColorError::OutOfGamut);
    }
    let [r, g, b] = oklch_to_srgb(color)?.channels().map(|v| v.clamp(0.0, 1.0));
    Srgb::new(r, g, b)
}

/// Luminance relative WCAG 2.x de canaux sRGB gamma.
///
/// # Errors
/// `OutOfRange` si un canal sort de [0, 1].
pub fn relative_luminance(color: Srgb) -> Result<f64, ColorError> {
    let [r, g, b] = unit_channels(color)?.map(gamma_to_linear);
    Ok(RED * r + GREEN * g + BLUE * b)
}

/// Rapport de contraste WCAG 2, de 1 à 21, indépendant de l'ordre des couleurs.
///
/// # Errors
/// Voir [`relative_luminance`].
pub fn contrast_ratio(a: Srgb, b: Srgb) -> Result<f64, ColorError> {
    let (first, second) = (relative_luminance(a)?, relative_luminance(b)?);
    Ok((first.max(second) + FLARE) / (first.min(second) + FLARE))
}
