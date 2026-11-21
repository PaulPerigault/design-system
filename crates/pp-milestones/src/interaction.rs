//! État d'interaction : étape active, étape survolée (l'inclinaison vit dans `tilt`).
//!
//! Une étape est un indice : les jalons, puis l'objectif (indice `n`) s'il existe.
use crate::error::SceneError;
use crate::tilt::Tilt;

#[derive(Debug, Clone, PartialEq)]
pub struct Interaction {
    stops: usize,
    active: Option<usize>,
    hover: Option<usize>,
    pub tilt: Tilt,
}

impl Interaction {
    /// # Errors
    /// `ActiveIndex` si `active` n'est pas un indice parmi `stops` étapes.
    pub fn new(stops: usize, active: Option<usize>) -> Result<Self, SceneError> {
        if active.is_some_and(|index| index >= stops) {
            return Err(SceneError::ActiveIndex);
        }
        Ok(Self {
            stops,
            active,
            hover: None,
            tilt: Tilt::default(),
        })
    }

    #[must_use]
    pub const fn active(&self) -> Option<usize> {
        self.active
    }

    #[must_use]
    pub const fn hover(&self) -> Option<usize> {
        self.hover
    }

    /// Change l'étape active ; `None` l'efface.
    ///
    /// # Errors
    /// `ActiveIndex` si l'indice sort du tableau.
    pub fn set_active(&mut self, index: Option<usize>) -> Result<(), SceneError> {
        if index.is_some_and(|i| i >= self.stops) {
            return Err(SceneError::ActiveIndex);
        }
        self.active = index;
        Ok(())
    }

    /// Change l'étape survolée ; un indice hors du tableau l'efface.
    pub fn set_hover(&mut self, index: Option<usize>) {
        self.hover = index.filter(|i| *i < self.stops);
    }
}
