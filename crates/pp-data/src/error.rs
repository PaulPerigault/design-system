//! Erreurs typées du crate : la variante décrit la cause, pas le message.
use core::fmt;

/// Cause d'un refus à la frontière du crate.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DataError {
    /// La suite de valeurs est vide (`stats.empty` côté TypeScript).
    EmptyInput,
    /// Une valeur est `NaN` ou infinie (`stats.non-finite`).
    NonFiniteValue,
    /// Une probabilité est hors de [0, 1] ou non finie (`stats.bad-probability`).
    BadProbability,
    /// `xs` et `values` n'ont pas la même longueur (`geometry.bad-input`).
    LengthMismatch,
    /// Une abscisse est `NaN` ou infinie (`geometry.bad-input`).
    NonFiniteAbscissa,
    /// La cible ne couvre pas 2 points par suite plus un par trou (`downsample.bad-target`).
    BadTarget,
    /// Plus de `MAX_POINTS` points : limite du contrat `Dataset` (`dataset.too-many-points`).
    TooManyPoints,
}

impl fmt::Display for DataError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let text = match self {
            Self::EmptyInput => "aucune valeur",
            Self::NonFiniteValue => "valeur non finie",
            Self::BadProbability => "probabilité hors de [0, 1]",
            Self::LengthMismatch => "abscisses et valeurs de longueurs différentes",
            Self::NonFiniteAbscissa => "abscisse non finie",
            Self::BadTarget => "cible trop basse pour les suites et les trous",
            Self::TooManyPoints => "trop de points",
        };
        f.write_str(text)
    }
}

impl core::error::Error for DataError {}
