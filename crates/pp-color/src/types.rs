//! Types de couleur validés à la construction : champs privés, valeurs toujours finies.
use crate::error::{ColorError, Component, finite};

/// Couleur OKLCH : clarté dans [0, 1], chroma ≥ 0, teinte en degrés (toute valeur finie).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Oklch {
    l: f64,
    c: f64,
    h: f64,
}

impl Oklch {
    /// # Errors
    /// `NonFinite` si une composante est `NaN` ou infinie ; `OutOfRange` si la clarté sort de
    /// [0, 1] ou si le chroma est négatif (mêmes bornes que `parseOklch` côté TypeScript).
    pub fn new(l: f64, c: f64, h: f64) -> Result<Self, ColorError> {
        let (l, c, h) = (
            finite(l, Component::Lightness)?,
            finite(c, Component::Chroma)?,
            finite(h, Component::Hue)?,
        );
        if !(0.0..=1.0).contains(&l) {
            return Err(ColorError::OutOfRange(Component::Lightness));
        }
        if c < 0.0 {
            return Err(ColorError::OutOfRange(Component::Chroma));
        }
        Ok(Self { l, c, h })
    }

    #[must_use]
    pub fn lightness(self) -> f64 {
        self.l
    }

    #[must_use]
    pub fn chroma(self) -> f64 {
        self.c
    }

    #[must_use]
    pub fn hue(self) -> f64 {
        self.h
    }

    /// Même couleur avec un autre chroma (validé comme dans [`Oklch::new`]).
    ///
    /// # Errors
    /// Voir [`Oklch::new`].
    pub fn with_chroma(self, c: f64) -> Result<Self, ColorError> {
        Self::new(self.l, c, self.h)
    }
}

/// Canaux sRGB linéaires ; hors de [0, 1] si la couleur sort du gamut.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LinearSrgb {
    r: f64,
    g: f64,
    b: f64,
}

/// Canaux sRGB gamma (transfert IEC 61966-2-1) ; hors de [0, 1] si hors gamut.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Srgb {
    r: f64,
    g: f64,
    b: f64,
}

impl Srgb {
    /// # Errors
    /// `NonFinite` si un canal est `NaN` ou infini. Aucun rognage : les canaux hors [0, 1] passent.
    pub fn new(r: f64, g: f64, b: f64) -> Result<Self, ColorError> {
        Ok(Self {
            r: finite(r, Component::Red)?,
            g: finite(g, Component::Green)?,
            b: finite(b, Component::Blue)?,
        })
    }

    #[must_use]
    pub fn channels(self) -> [f64; 3] {
        [self.r, self.g, self.b]
    }
}

impl LinearSrgb {
    /// Interne : une conversion d'entrées finies peut déborder en infini (chroma énorme).
    pub(crate) fn new(r: f64, g: f64, b: f64) -> Result<Self, ColorError> {
        Ok(Self {
            r: finite(r, Component::Red)?,
            g: finite(g, Component::Green)?,
            b: finite(b, Component::Blue)?,
        })
    }

    #[must_use]
    pub fn channels(self) -> [f64; 3] {
        [self.r, self.g, self.b]
    }

    /// Canaux ramenés dans [0, 1] (bruit d'arrondi aux bords du gamut).
    #[must_use]
    pub fn clamped(self) -> Self {
        Self {
            r: self.r.clamp(0.0, 1.0),
            g: self.g.clamp(0.0, 1.0),
            b: self.b.clamp(0.0, 1.0),
        }
    }
}
