//! Image d'une scène : avance l'horloge, applique la cible de la caméra, dresse la liste de dessin.
use crate::camera::camera_for;
use crate::plan::{DrawItem, Inputs, Pose, build};
use crate::progress::nearest_to;
use crate::state::SceneState;
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

impl SceneState {
    /// Image à `now` (millisecondes, horloge de l'appelant).
    pub fn frame(&mut self, now: f32) -> Frame {
        let dt = self
            .last
            .map_or(0.0, |last| (now - last).clamp(0.0, MAX_STEP_MS));
        self.last = Some(now);
        if let Some(target) = self.pending.take() {
            let theme = &self.theme;
            self.camera
                .retarget(now, target, theme.duration_base, theme.easing);
        }
        self.interaction.tilt.step(dt, self.theme.duration_fast);
        self.shown = self.camera.value(now);
        let pose = Pose {
            s: self.shown,
            tilt: self.interaction.tilt.angles(),
            tilted: (self.interaction.hover())
                .unwrap_or_else(|| nearest_to(self.shown, self.data.stops())),
            hover: self.interaction.hover(),
            active: self.interaction.active(),
        };
        let inputs = Inputs {
            data: &self.data,
            theme: &self.theme,
            pack: &self.pack,
        };
        Frame {
            view_projection: camera_for(self.shown, self.framing(), self.data.stops())
                .view_projection(self.aspect),
            items: build(&inputs, &pose),
            animating: self.camera.is_running(now) || !self.interaction.tilt.settled(),
        }
    }
}
