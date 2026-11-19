//! Statut et emblème d'un jalon : deux jeux fermés.
use crate::error::SceneError;

/// Jalon atteint (médaille pleine) ou prévu (fil de fer).
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Status {
    Achieved,
    Planned,
}

impl Status {
    /// # Errors
    /// `UnknownStatus` pour tout texte autre que `achieved` et `planned`.
    pub fn parse(text: &str) -> Result<Self, SceneError> {
        match text {
            "achieved" => Ok(Self::Achieved),
            "planned" => Ok(Self::Planned),
            _ => Err(SceneError::UnknownStatus),
        }
    }
}

/// Jeu fermé d'emblèmes géométriques ; ajouter une clé est une évolution du crate.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Emblem {
    Disc,
    Check,
    Shield,
    Cloud,
    Network,
    Database,
    Code,
    Key,
    Gear,
}

impl Emblem {
    /// Toutes les clés, dans l'ordre des maillages.
    pub const ALL: [Self; 9] = [
        Self::Disc,
        Self::Check,
        Self::Shield,
        Self::Cloud,
        Self::Network,
        Self::Database,
        Self::Code,
        Self::Key,
        Self::Gear,
    ];

    #[must_use]
    pub const fn key(self) -> &'static str {
        match self {
            Self::Disc => "disc",
            Self::Check => "check",
            Self::Shield => "shield",
            Self::Cloud => "cloud",
            Self::Network => "network",
            Self::Database => "database",
            Self::Code => "code",
            Self::Key => "key",
            Self::Gear => "gear",
        }
    }

    /// Clé vide : `Disc`, la valeur par défaut. Clé inconnue : erreur, jamais de repli muet.
    ///
    /// # Errors
    /// `UnknownEmblem` pour une clé hors du jeu fermé.
    pub fn parse(text: &str) -> Result<Self, SceneError> {
        if text.is_empty() {
            return Ok(Self::Disc);
        }
        Self::ALL
            .into_iter()
            .find(|emblem| emblem.key() == text)
            .ok_or(SceneError::UnknownEmblem)
    }
}
