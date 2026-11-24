//! Statut d'un jalon : un jeu fermé.
use crate::error::SceneError;

/// Jalon obtenu (médaille pleine, badge HTML superposé) ou planifié (fantôme filaire).
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
