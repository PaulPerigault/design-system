//! Commandes de la scène : progression, étape active ou survolée, pointeur, gyroscope, sélection.
use crate::error::SceneError;
use crate::picking::hit;
use crate::progress::{abscissa, progress_of};
use crate::state::SceneState;
use glam::Vec2;

impl SceneState {
    /// Demande la progression `p` (bornée à [0, 1]) : la caméra glisse vers l'étape voulue avec la
    /// durée et la courbe du thème, ou saute si la durée est nulle. Appliquée à la prochaine image.
    ///
    /// # Errors
    /// `Progress` si `p` n'est pas un nombre fini.
    pub fn set_progress(&mut self, p: f32) -> Result<(), SceneError> {
        if !p.is_finite() {
            return Err(SceneError::Progress);
        }
        let target = abscissa(p, self.data.len(), self.data.has_goal());
        let current = self.pending.unwrap_or_else(|| self.camera.target());
        if (target - current).abs() > f32::EPSILON {
            self.pending = Some(target);
        }
        Ok(())
    }

    /// Progression de l'étape `id` (jalon ou `GOAL_ID`) ; `None` si l'identifiant est inconnu.
    #[must_use]
    pub fn progress_of_id(&self, id: &str) -> Option<f32> {
        let index = self.data.index_of(id)?;
        Some(progress_of(index, self.data.len(), self.data.has_goal()))
    }

    /// Étape active (anneau d'accent) ; identifiant vide : aucune. Rend faux si l'identifiant est
    /// inconnu (rien ne change).
    pub fn set_active_id(&mut self, id: &str) -> bool {
        let index = self.data.index_of(id);
        (id.is_empty() || index.is_some()) && self.interaction.set_active(index).is_ok()
    }

    /// Étape survolée (anneau d'accent, inclinaison) ; identifiant vide ou inconnu : aucune.
    pub fn set_hover_id(&mut self, id: &str) {
        self.interaction.set_hover(self.data.index_of(id));
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
        self.interaction.active().and_then(|i| self.data.id_at(i))
    }

    /// Étape sous le point `ndc` (coordonnées normalisées, y vers le haut) dans la dernière image
    /// dessinée ; la plus proche de la caméra si plusieurs se recouvrent.
    #[must_use]
    pub fn pick(&self, ndc: Vec2) -> Option<usize> {
        hit(&self.discs(), ndc, self.aspect)
    }

    /// Identifiant de l'étape `index` (`GOAL_ID` pour l'objectif).
    #[must_use]
    pub fn id_at(&self, index: usize) -> Option<&str> {
        self.data.id_at(index)
    }
}
