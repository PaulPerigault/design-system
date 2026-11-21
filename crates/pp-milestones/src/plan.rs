//! Liste de dessin d'une image : ce qui est tracé, avec quelle matrice et quelle couleur.
//!
//! La couche WebGL ne décide rien : elle parcourt cette liste et appelle `drawElements`.
use crate::data::MilestonesData;
use crate::geometry::pack::{Pack, Part, Range};
use crate::layout::{ordinal, rail_point};
use crate::medals::{goal, medal};
use crate::theme::{Rgb, Slot, Theme};
use glam::{Mat4, Vec2, Vec3};

/// Direction de la lumière (vers la source), une seule, fixe, et part ambiante.
pub const LIGHT: Vec3 = Vec3::new(-0.4, 0.7, 0.6);
pub const AMBIENT: f32 = 0.6;
/// Fondu du rail et des fantômes vers le transparent : début et fin, en distance de la caméra.
pub const FOG_START: f32 = 9.0;
pub const FOG_END: f32 = 42.0;
/// Étapes tracées autour de la caméra (en abscisses) : derrière, puis devant.
pub const BEHIND_UNITS: f32 = 2.0;
pub const AHEAD_UNITS: f32 = 5.0;

#[derive(Debug, Clone, Copy)]
pub struct DrawItem {
    pub range: Range,
    pub model: Mat4,
    pub color: Rgb,
    pub lit: bool,
    /// Fondu avec la distance (rail, repères, fantômes).
    pub fade: bool,
    /// Face de badge : indice du jalon dont la texture se plaque telle quelle, sans couleur.
    pub texture: Option<usize>,
}

/// Ce que la liste de dessin lit : données, thème et maillages.
#[derive(Debug, Clone, Copy)]
pub struct Inputs<'a> {
    pub data: &'a MilestonesData,
    pub theme: &'a Theme,
    pub pack: &'a Pack,
}

/// L'instant : abscisse de la caméra, inclinaison et étapes survolée, active, inclinée.
#[derive(Debug, Clone, Copy)]
pub struct Pose {
    pub s: f32,
    pub tilt: Vec2,
    pub tilted: usize,
    pub hover: Option<usize>,
    pub active: Option<usize>,
}

impl Inputs<'_> {
    pub(crate) fn item(&self, part: Part, model: Mat4, slot: Slot) -> Option<DrawItem> {
        self.pack.range(part).map(|range| DrawItem {
            range,
            model,
            color: self.theme.color(slot),
            lit: false,
            fade: false,
            texture: None,
        })
    }

    pub(crate) fn lit(&self, part: Part, model: Mat4, slot: Slot) -> Option<DrawItem> {
        self.item(part, model, slot)
            .map(|i| DrawItem { lit: true, ..i })
    }

    pub(crate) fn faded(&self, part: Part, model: Mat4, slot: Slot) -> Option<DrawItem> {
        self.item(part, model, slot)
            .map(|i| DrawItem { fade: true, ..i })
    }
}

/// Éléments à tracer, du fond vers l'avant : rail, repères, objectif, puis médailles proches.
#[must_use]
pub fn build(inputs: &Inputs<'_>, pose: &Pose) -> Vec<DrawItem> {
    let mut items = Vec::new();
    items.extend(inputs.faded(Part::Rail, Mat4::IDENTITY, Slot::Line));
    for index in 0..inputs.data.stops() {
        let at = Mat4::from_translation(rail_point(ordinal(index), 0.0));
        items.extend(inputs.faded(Part::Marker, at, Slot::Muted));
    }
    for index in (0..inputs.data.stops()).rev() {
        let gap = ordinal(index) - pose.s;
        if !(-BEHIND_UNITS..=AHEAD_UNITS).contains(&gap) {
            continue;
        }
        if index == inputs.data.len() {
            goal(inputs, pose, &mut items);
        } else {
            medal(inputs, index, pose, &mut items);
        }
    }
    items
}
