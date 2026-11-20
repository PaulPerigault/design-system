//! Erreurs typées de la scène : la variante décrit la cause, pas le message.
use core::fmt;

/// Cause d'un refus à la frontière du crate.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SceneError {
    /// Aucun jalon, ou plus que `MAX_MILESTONES`.
    MilestoneCount,
    /// Un identifiant n'est pas de la forme `[a-z0-9-]+`.
    InvalidId,
    /// Deux jalons portent le même identifiant.
    DuplicateId,
    /// Le statut n'est ni `achieved` ni `planned`.
    UnknownStatus,
    /// La clé d'emblème n'est pas dans le jeu fermé.
    UnknownEmblem,
    /// Les tableaux de jalons n'ont pas la même longueur.
    LengthMismatch,
    /// Le tableau du thème n'a pas la longueur attendue.
    ThemeLength,
    /// Une valeur du thème est non finie ou hors de sa plage.
    ThemeValue,
    /// Une couleur du thème n'est pas convertible en sRGB.
    ThemeColor,
    /// L'indice du jalon actif sort du tableau.
    ActiveIndex,
    /// Une dimension du canvas n'est pas un nombre strictement positif.
    Viewport,
    /// La géométrie dépasse la capacité des indices.
    GeometrySize,
}

impl SceneError {
    /// Code littéral de frontière, repris tel quel par `packages/milestones-3d/src/error.ts`.
    #[must_use]
    pub const fn code(self) -> &'static str {
        match self {
            Self::MilestoneCount => "milestone-count",
            Self::InvalidId => "invalid-id",
            Self::DuplicateId => "duplicate-id",
            Self::UnknownStatus => "unknown-status",
            Self::UnknownEmblem => "unknown-emblem",
            Self::LengthMismatch => "length-mismatch",
            Self::ThemeLength => "theme-length",
            Self::ThemeValue => "theme-value",
            Self::ThemeColor => "theme-color",
            Self::ActiveIndex => "active-index",
            Self::Viewport => "viewport",
            Self::GeometrySize => "geometry-size",
        }
    }
}

impl fmt::Display for SceneError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(self.code())
    }
}

impl core::error::Error for SceneError {}
