//! État d'interaction : jalon actif et navigation (l'inclinaison vit dans `tilt`).
use crate::error::SceneError;
use crate::tilt::Tilt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Key {
    Next,
    Previous,
    First,
    Last,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Interaction {
    count: usize,
    active: usize,
    pub tilt: Tilt,
}

impl Interaction {
    /// # Errors
    /// `ActiveIndex` si `active` n'est pas un indice de `count` jalons.
    pub fn new(count: usize, active: usize) -> Result<Self, SceneError> {
        if active >= count {
            return Err(SceneError::ActiveIndex);
        }
        Ok(Self {
            count,
            active,
            tilt: Tilt::default(),
        })
    }

    #[must_use]
    pub const fn active(&self) -> usize {
        self.active
    }

    /// Active le jalon `index` ; rend vrai s'il change.
    ///
    /// # Errors
    /// `ActiveIndex` si l'indice sort du tableau.
    pub fn set_active(&mut self, index: usize) -> Result<bool, SceneError> {
        if index >= self.count {
            return Err(SceneError::ActiveIndex);
        }
        let changed = index != self.active;
        self.active = index;
        Ok(changed)
    }

    /// Navigation au clavier : rend le nouvel indice s'il a changé.
    pub fn navigate(&mut self, key: Key) -> Option<usize> {
        let last = self.count.saturating_sub(1);
        let target = match key {
            Key::Next => (self.active + 1).min(last),
            Key::Previous => self.active.saturating_sub(1),
            Key::First => 0,
            Key::Last => last,
        };
        (target != self.active).then(|| {
            self.active = target;
            target
        })
    }
}
