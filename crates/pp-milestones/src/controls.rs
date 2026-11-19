//! Commandes de la scène : jalon actif, navigation, pointeur, gyroscope, sélection.
use crate::camera::view_projection;
use crate::error::SceneError;
use crate::interaction::Key;
use crate::picking::pick;
use crate::state::SceneState;
use glam::Vec2;

impl SceneState {
    /// Active un jalon et lance la glissade de la caméra.
    ///
    /// # Errors
    /// `ActiveIndex` si l'indice sort du tableau.
    #[allow(clippy::cast_precision_loss, reason = "indice ≤ 24")]
    pub fn set_active(&mut self, index: usize, now: f32) -> Result<(), SceneError> {
        if self.interaction.set_active(index)? {
            self.glide(index as f32, now);
        }
        Ok(())
    }

    /// # Errors
    /// `ActiveIndex` si l'identifiant est inconnu.
    pub fn set_active_id(&mut self, id: &str, now: f32) -> Result<(), SceneError> {
        let index = self.data.index_of(id).ok_or(SceneError::ActiveIndex)?;
        self.set_active(index, now)
    }

    #[allow(clippy::cast_precision_loss, reason = "indice ≤ 24")]
    pub fn navigate(&mut self, key: Key, now: f32) -> Option<usize> {
        let index = self.interaction.navigate(key)?;
        self.glide(index as f32, now);
        Some(index)
    }

    fn glide(&mut self, target: f32, now: f32) {
        self.camera
            .retarget(now, target, self.theme.duration_base, self.theme.easing);
    }

    pub fn pointer_move(&mut self, position: Vec2) {
        self.interaction.tilt.pointer_move(position);
    }

    pub fn pointer_leave(&mut self) {
        self.interaction.tilt.pointer_leave();
    }

    pub fn set_gyro(&mut self, tilt: Option<Vec2>) {
        self.interaction.tilt.set_gyro(tilt);
    }

    #[must_use]
    pub fn active_id(&self) -> Option<&str> {
        self.data
            .milestones()
            .get(self.interaction.active())
            .map(|milestone| milestone.id.as_str())
    }

    /// Jalon sous le point `ndc` (coordonnées normalisées, y vers le haut), s'il y en a un.
    #[must_use]
    pub fn pick(&self, ndc: Vec2, now: f32) -> Option<usize> {
        pick(
            self.data.len(),
            view_projection(self.camera.value(now), self.aspect),
            ndc,
        )
    }

    /// Identifiant du jalon `index`.
    #[must_use]
    pub fn id_at(&self, index: usize) -> Option<&str> {
        self.data.milestones().get(index).map(|m| m.id.as_str())
    }
}
