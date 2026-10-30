//! Contraste APCA, Lc signé. Mêmes définitions et mêmes constantes que `apcaLc`
//! (`packages/tokens/src/lib/contrast.ts`) : APCA 0.0.98G-4g, Andrew Somers (Myndex),
//! apca-w3 0.1.9. Informatif seulement : WCAG 3 n'a pas d'algorithme arrêté, jamais bloquant.
use crate::contrast::unit_channels;
use crate::error::ColorError;
use crate::types::Srgb;

const MAIN_TRC: f64 = 2.4;
const RED: f64 = 0.212_672_9;
const GREEN: f64 = 0.715_152_2;
const BLUE: f64 = 0.072_175;
const NORM_BG: f64 = 0.56;
const NORM_TXT: f64 = 0.57;
const REV_TXT: f64 = 0.62;
const REV_BG: f64 = 0.65;
const BLACK_THRESHOLD: f64 = 0.022;
const BLACK_CLAMP: f64 = 1.414;
const SCALE: f64 = 1.14;
const LOW_OFFSET: f64 = 0.027;
const DELTA_Y_MIN: f64 = 0.0005;
const LOW_CLIP: f64 = 0.1;
const LC_SCALE: f64 = 100.0;

/// Luminance APCA : puissance simple (pas la courbe sRGB), puis rehaussement des noirs.
fn luminance(color: Srgb) -> Result<f64, ColorError> {
    let [r, g, b] = unit_channels(color)?.map(|v| v.powf(MAIN_TRC));
    let y = RED * r + GREEN * g + BLUE * b;
    Ok(if y > BLACK_THRESHOLD {
        y
    } else {
        y + (BLACK_THRESHOLD - y).powf(BLACK_CLAMP)
    })
}

fn normal_polarity(text: f64, background: f64) -> f64 {
    let sapc = (background.powf(NORM_BG) - text.powf(NORM_TXT)) * SCALE;
    if sapc < LOW_CLIP {
        0.0
    } else {
        sapc - LOW_OFFSET
    }
}

fn reverse_polarity(text: f64, background: f64) -> f64 {
    let sapc = (background.powf(REV_BG) - text.powf(REV_TXT)) * SCALE;
    if sapc > -LOW_CLIP {
        0.0
    } else {
        sapc + LOW_OFFSET
    }
}

/// Lc APCA signé : positif = texte sombre sur fond clair, négatif = texte clair sur fond sombre.
///
/// # Errors
/// `OutOfRange` si un canal d'une des couleurs sort de [0, 1].
pub fn apca_lc(text: Srgb, background: Srgb) -> Result<f64, ColorError> {
    let (text, background) = (luminance(text)?, luminance(background)?);
    if (background - text).abs() < DELTA_Y_MIN {
        return Ok(0.0);
    }
    let polarity = if background > text {
        normal_polarity
    } else {
        reverse_polarity
    };
    Ok(polarity(text, background) * LC_SCALE)
}
