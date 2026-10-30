//! Hexadécimal `#rrggbb` ↔ sRGB et OKLCH. Mêmes définitions que `toHex` et `hexToOklch`
//! (`packages/tokens/src/lib/color.ts`) : sept caractères exacts, casse libre, aucun espace admis.
use crate::convert::{oklch_to_srgb, srgb_to_oklch};
use crate::error::ColorError;
use crate::gamut::in_srgb_gamut;
use crate::types::{Oklch, Srgb};

const BYTE_MAX: f64 = 255.0;
const HEX_RADIX: u32 = 16;
const HEX_DIGITS: usize = 6;
const PAIR_LENGTH: usize = 2;

/// `#rrggbb` → canaux sRGB gamma dans [0, 1].
///
/// # Errors
/// `InvalidHex` si le texte n'a pas la forme `#` suivi de six chiffres hexadécimaux.
pub fn parse_hex(text: &str) -> Result<Srgb, ColorError> {
    let digits = text
        .strip_prefix('#')
        .filter(|rest| rest.len() == HEX_DIGITS && rest.bytes().all(|b| b.is_ascii_hexdigit()))
        .ok_or(ColorError::InvalidHex)?;
    let mut channels = [0.0; 3];
    let (pairs, _) = digits.as_bytes().as_chunks::<PAIR_LENGTH>();
    for (slot, pair) in channels.iter_mut().zip(pairs) {
        let pair = core::str::from_utf8(pair).map_err(|_| ColorError::InvalidHex)?;
        let byte = u8::from_str_radix(pair, HEX_RADIX).map_err(|_| ColorError::InvalidHex)?;
        *slot = f64::from(byte) / BYTE_MAX;
    }
    let [r, g, b] = channels;
    Srgb::new(r, g, b)
}

/// `#rrggbb` → OKLCH, teinte dans [0, 360), 0 pour un gris.
///
/// # Errors
/// `InvalidHex` si le texte est mal formé.
pub fn hex_to_oklch(text: &str) -> Result<Oklch, ColorError> {
    srgb_to_oklch(parse_hex(text)?)
}

#[allow(
    clippy::cast_possible_truncation,
    clippy::cast_sign_loss,
    reason = "valeur ramenée dans [0, 255] et arrondie : la conversion en u8 est exacte"
)]
fn to_byte(value: f64) -> u8 {
    (value.clamp(0.0, 1.0) * BYTE_MAX).round() as u8
}

/// OKLCH → `#rrggbb` minuscule. Hors gamut sRGB : refus, jamais de rognage.
///
/// # Errors
/// `OutOfGamut` si la couleur sort du gamut sRGB ; sinon voir [`oklch_to_srgb`].
pub fn to_hex(color: Oklch) -> Result<String, ColorError> {
    if !in_srgb_gamut(color) {
        return Err(ColorError::OutOfGamut);
    }
    let [r, g, b] = oklch_to_srgb(color)?.channels().map(to_byte);
    Ok(format!("#{r:02x}{g:02x}{b:02x}"))
}
