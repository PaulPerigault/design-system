//! État complet d'une scène : données, thème, interaction, caméra et horloge injectée.
use crate::animation::Tween;
use crate::camera::view_projection;
use crate::data::MilestonesData;
use crate::error::SceneError;
use crate::geometry::pack::Pack;
use crate::interaction::Interaction;
use crate::plan::{DrawItem, build};
use crate::theme::Theme;
use glam::Mat4;

/// Plafond d'un pas de temps (ms) : un onglet resté caché ne doit pas produire un saut.
const MAX_STEP_MS: f32 = 100.0;

#[derive(Debug, Clone)]
pub struct Frame {
    pub view_projection: Mat4,
    pub items: Vec<DrawItem>,
    /// Vrai tant qu'une transition ou une inclinaison est en cours : une autre image est due.
    pub animating: bool,
}

#[derive(Debug)]
pub struct SceneState {
    pub(crate) data: MilestonesData,
    pub(crate) theme: Theme,
    pub(crate) pack: Pack,
    pub(crate) interaction: Interaction,
    pub(crate) camera: Tween,
    pub(crate) aspect: f32,
    pub(crate) last: Option<f32>,
}

impl SceneState {
    /// # Errors
    /// `ActiveIndex` si `active` sort du tableau, `GeometrySize` si le maillage déborde.
    #[allow(clippy::cast_precision_loss, reason = "indice ≤ 24")]
    pub fn new(data: MilestonesData, theme: Theme, active: usize) -> Result<Self, SceneError> {
        let interaction = Interaction::new(data.len(), active)?;
        let pack = Pack::build(data.len())?;
        Ok(Self {
            data,
            theme,
            pack,
            interaction,
            camera: Tween::at(active as f32),
            aspect: 1.0,
            last: None,
        })
    }

    #[must_use]
    pub const fn pack(&self) -> &Pack {
        &self.pack
    }

    #[must_use]
    pub const fn theme(&self) -> &Theme {
        &self.theme
    }

    pub const fn set_theme(&mut self, theme: Theme) {
        self.theme = theme;
    }

    /// # Errors
    /// `Viewport` si une dimension n'est pas un nombre strictement positif.
    pub fn resize(&mut self, width: f32, height: f32) -> Result<(), SceneError> {
        if !(width.is_finite() && height.is_finite() && width > 0.0 && height > 0.0) {
            return Err(SceneError::Viewport);
        }
        self.aspect = width / height;
        Ok(())
    }

    /// Image à `now` (millisecondes, horloge de l'appelant).
    pub fn frame(&mut self, now: f32) -> Frame {
        let dt = self
            .last
            .map_or(0.0, |last| (now - last).clamp(0.0, MAX_STEP_MS));
        self.last = Some(now);
        self.interaction.tilt.step(dt, self.theme.duration_fast);
        let s = self.camera.value(now);
        let items = build(
            &self.data,
            &self.theme,
            &self.pack,
            s,
            self.interaction.tilt.angles(),
        );
        Frame {
            view_projection: view_projection(s, self.aspect),
            items,
            animating: self.camera.is_running(now) || !self.interaction.tilt.settled(),
        }
    }
}
