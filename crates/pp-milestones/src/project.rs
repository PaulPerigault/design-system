//! Projection des étapes à l'écran : positions des étiquettes HTML posées sur la scène.
use crate::camera::camera_at;
use crate::layout::{ordinal, path_point};
use crate::picking::{Disc, disc};
use crate::plan::{AHEAD_UNITS, BEHIND_UNITS};
use crate::state::SceneState;
use glam::Vec2;

/// Une étape à l'écran : centre normalisé ([0, 1], origine en haut à gauche), rayon de la médaille
/// rapporté à la hauteur du canvas, et visibilité (devant la caméra et dans le cadre).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Projected {
    pub x: f32,
    pub y: f32,
    pub scale: f32,
    pub visible: bool,
}

const HIDDEN: Projected = Projected {
    x: 0.0,
    y: 0.0,
    scale: 0.0,
    visible: false,
};
const HALF: f32 = 0.5;

fn in_frame(ndc: Vec2) -> bool {
    ndc.abs().max_element() <= 1.0
}

impl SceneState {
    /// Disques de toutes les étapes (jalons puis objectif), pour la caméra affichée.
    pub(crate) fn discs(&self) -> Vec<Option<Disc>> {
        let camera = camera_at(self.shown, self.aspect, self.data.stops());
        let matrix = camera.view_projection(self.aspect);
        (0..self.data.stops())
            .map(|index| {
                let at = ordinal(index);
                let drawn = (-BEHIND_UNITS..=AHEAD_UNITS).contains(&(at - self.shown));
                drawn
                    .then(|| disc(path_point(at), &camera, matrix, self.aspect))
                    .flatten()
            })
            .collect()
    }

    /// Une entrée par étape, dans l'ordre : les jalons, puis l'objectif s'il existe.
    #[must_use]
    pub fn project(&self) -> Vec<Projected> {
        self.discs()
            .into_iter()
            .map(|found| found.map_or(HIDDEN, |d| self.projected(d)))
            .collect()
    }

    fn projected(&self, d: Disc) -> Projected {
        let ndc = Vec2::new(d.center.x / self.aspect, d.center.y);
        Projected {
            x: (ndc.x + 1.0) * HALF,
            y: (1.0 - ndc.y) * HALF,
            scale: d.radius * HALF,
            visible: in_frame(ndc),
        }
    }
}
