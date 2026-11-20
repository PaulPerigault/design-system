//! Thème de la scène : couleurs, durées et courbe, tous fournis par l'appelant.
//!
//! L'enveloppe TypeScript lit les jetons `--pp-*` résolus et les passe en nombres (voir
//! `Theme::from_slice`). Aucune valeur de couleur, de durée ni de courbe n'est écrite ici.
//! Les couleurs sortent en sRGB gamma : le canvas affiche du sRGB, l'ombrage est multiplicatif.
use crate::easing::CubicBezier;
use crate::error::SceneError;
use pp_color::{Oklch, fit_to_gamut, oklch_to_srgb};

pub const COLOR_COUNT: usize = 6;
/// Par couleur : espace (0 sRGB, 1 OKLCH), puis trois composantes.
pub const COLOR_STRIDE: usize = 4;
pub const EASING_LEN: usize = 4;
/// Couleurs, puis `duration-base`, `duration-fast`, puis la courbe.
pub const THEME_LEN: usize = COLOR_COUNT * COLOR_STRIDE + 2 + EASING_LEN;
pub const SPACE_SRGB: f32 = 0.0;
pub const SPACE_OKLCH: f32 = 1.0;
/// Plafond d'une durée : au-delà, la valeur lue n'est pas une durée de transition.
pub const MAX_DURATION_MS: f32 = 10_000.0;
const TAG_TOLERANCE: f32 = 0.5;

/// Rôle d'une couleur, dans l'ordre du tableau reçu.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Slot {
    Bg,
    Fg,
    Accent,
    OnAccent,
    Line,
    Muted,
}

pub type Rgb = [f32; 3];

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Theme {
    colors: [Rgb; COLOR_COUNT],
    pub duration_base: f32,
    pub duration_fast: f32,
    pub easing: CubicBezier,
}

impl Theme {
    /// # Errors
    /// `ThemeLength` si le tableau n'a pas `THEME_LEN` valeurs ; `ThemeValue` pour une valeur non
    /// finie, une durée hors de [0, `MAX_DURATION_MS`] ou une courbe invalide ; `ThemeColor` pour
    /// une couleur dont l'espace est inconnu ou dont les composantes ne convertissent pas.
    pub fn from_slice(values: &[f32]) -> Result<Self, SceneError> {
        if values.len() != THEME_LEN {
            return Err(SceneError::ThemeLength);
        }
        let mut colors = [[0.0; 3]; COLOR_COUNT];
        let (chunks, _) = values.as_chunks::<COLOR_STRIDE>();
        for (slot, chunk) in colors.iter_mut().zip(chunks) {
            *slot = color(*chunk)?;
        }
        let rest = values.get(COLOR_COUNT * COLOR_STRIDE..).unwrap_or_default();
        let &[base, fast, x1, y1, x2, y2] = rest else {
            return Err(SceneError::ThemeLength);
        };
        Ok(Self {
            colors,
            duration_base: duration(base)?,
            duration_fast: duration(fast)?,
            easing: CubicBezier::new(x1, y1, x2, y2)?,
        })
    }

    #[must_use]
    pub fn color(&self, slot: Slot) -> Rgb {
        self.colors.get(slot as usize).copied().unwrap_or_default()
    }
}

fn duration(value: f32) -> Result<f32, SceneError> {
    if value.is_finite() && (0.0..=MAX_DURATION_MS).contains(&value) {
        Ok(value)
    } else {
        Err(SceneError::ThemeValue)
    }
}

fn color(chunk: [f32; COLOR_STRIDE]) -> Result<Rgb, SceneError> {
    let [space, a, b, c] = chunk;
    if [a, b, c].iter().any(|value| !value.is_finite()) {
        return Err(SceneError::ThemeValue);
    }
    if (space - SPACE_SRGB).abs() < TAG_TOLERANCE {
        Ok([a, b, c].map(|channel| channel.clamp(0.0, 1.0)))
    } else if (space - SPACE_OKLCH).abs() < TAG_TOLERANCE {
        oklch(a, b, c)
    } else {
        Err(SceneError::ThemeColor)
    }
}

#[allow(
    clippy::cast_possible_truncation,
    reason = "canaux sRGB bornés à [0, 1]"
)]
fn narrow(value: f64) -> f32 {
    value.clamp(0.0, 1.0) as f32
}

fn oklch(l: f32, c: f32, h: f32) -> Result<Rgb, SceneError> {
    let color =
        Oklch::new(f64::from(l), f64::from(c), f64::from(h)).map_err(|_| SceneError::ThemeColor)?;
    let srgb = oklch_to_srgb(fit_to_gamut(color)).map_err(|_| SceneError::ThemeColor)?;
    Ok(srgb.channels().map(narrow))
}
