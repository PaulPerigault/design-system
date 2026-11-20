//! Liste de dessin d'une image : ce qui est tracé, avec quelle matrice et quelle couleur.
//!
//! La couche WebGL ne décide rien : elle parcourt cette liste et appelle `drawElements`.
use crate::camera::pitch;
use crate::data::MilestonesData;
use crate::geometry::pack::{Pack, Part, Range};
use crate::kinds::Status;
use crate::layout::{path_point, path_tangent};
use crate::theme::{Rgb, Slot, Theme};
use glam::{Mat4, Quat, Vec2, Vec3};

/// Direction de la lumière (vers la source), une seule, fixe.
pub const LIGHT: Vec3 = Vec3::new(-0.4, 0.7, 0.6);
pub const AMBIENT: f32 = 0.45;
/// Brouillard vers la couleur de fond : début et fin, en distance de la caméra.
pub const FOG_START: f32 = 9.0;
pub const FOG_END: f32 = 42.0;
/// Grossissement du jalon regardé (le facteur décroît avec l'écart à la caméra, sur une unité).
pub const FOCUS_BOOST: f32 = 0.14;

#[derive(Debug, Clone, Copy)]
pub struct DrawItem {
    pub range: Range,
    pub model: Mat4,
    pub color: Rgb,
    pub lit: bool,
}

fn item(pack: &Pack, part: Part, model: Mat4, color: Rgb, lit: bool) -> Option<DrawItem> {
    pack.range(part).map(|range| DrawItem {
        range,
        model,
        color,
        lit,
    })
}

#[allow(clippy::cast_precision_loss, reason = "indice ≤ 24")]
fn medal_model(index: usize, camera_s: f32, tilt: Vec2) -> Mat4 {
    let s = index as f32;
    let focus = (1.0 - (camera_s - s).abs()).clamp(0.0, 1.0);
    let heading = path_tangent(s);
    // La face avant (+z) regarde l'œil, donc l'opposé de la direction du chemin.
    let face = Quat::from_rotation_y((-heading.x).atan2(-heading.z));
    let toward_eye = Quat::from_rotation_x(-pitch());
    let lean = Quat::from_rotation_y(tilt.x) * Quat::from_rotation_x(-tilt.y);
    Mat4::from_scale_rotation_translation(
        Vec3::splat(1.0 + FOCUS_BOOST * focus),
        face * toward_eye * lean,
        path_point(s),
    )
}

/// Éléments à tracer, du fond vers l'avant : ruban, cible, puis médailles.
#[must_use]
#[allow(clippy::cast_precision_loss, reason = "longueur ≤ 24")]
pub fn build(
    data: &MilestonesData,
    theme: &Theme,
    pack: &Pack,
    camera_s: f32,
    tilt: Vec2,
) -> Vec<DrawItem> {
    let mut items = Vec::new();
    items.extend(item(
        pack,
        Part::Ribbon,
        Mat4::IDENTITY,
        theme.color(Slot::Line),
        false,
    ));
    if data.has_goal() {
        let at = Mat4::from_translation(path_point(data.len() as f32));
        items.extend(item(pack, Part::Goal, at, theme.color(Slot::Fg), false));
    }
    for (index, milestone) in data.milestones().iter().enumerate() {
        let model = medal_model(index, camera_s, tilt);
        match milestone.status {
            Status::Achieved => {
                items.extend(item(
                    pack,
                    Part::Body,
                    model,
                    theme.color(Slot::Accent),
                    true,
                ));
                items.extend(item(
                    pack,
                    Part::Emblem(milestone.emblem),
                    model,
                    theme.color(Slot::OnAccent),
                    true,
                ));
            }
            Status::Planned => items.extend(item(
                pack,
                Part::Wire,
                model,
                theme.color(Slot::Muted),
                false,
            )),
        }
    }
    items
}
