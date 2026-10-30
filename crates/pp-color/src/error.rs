//! Erreurs typées du crate : la variante décrit la cause, pas le message.
use core::fmt;

/// Grandeur fautive, pour situer l'erreur sans message libre.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Component {
    Lightness,
    Chroma,
    Hue,
    Red,
    Green,
    Blue,
    Epsilon,
}

/// Cause d'un refus à la frontière du crate.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ColorError {
    /// La valeur est `NaN` ou infinie.
    NonFinite(Component),
    /// La valeur est finie mais hors de sa plage (clarté hors [0, 1], chroma ou epsilon < 0).
    OutOfRange(Component),
    /// Le texte n'est pas de la forme `#rrggbb`.
    InvalidHex,
    /// La couleur sort du gamut sRGB : la palette n'est jamais rognée (comme `toHex` en TypeScript).
    OutOfGamut,
}

impl fmt::Display for ColorError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::NonFinite(component) => write!(f, "{component:?} : valeur non finie"),
            Self::OutOfRange(component) => write!(f, "{component:?} : valeur hors plage"),
            Self::InvalidHex => write!(f, "hexadécimal : attendu #rrggbb"),
            Self::OutOfGamut => write!(f, "couleur hors gamut sRGB"),
        }
    }
}

impl core::error::Error for ColorError {}

/// Rend `value` si elle est finie.
pub(crate) fn finite(value: f64, component: Component) -> Result<f64, ColorError> {
    if value.is_finite() {
        Ok(value)
    } else {
        Err(ColorError::NonFinite(component))
    }
}
