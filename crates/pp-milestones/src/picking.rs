//! Sélection au pointeur : la médaille dont le disque projeté contient le point visé.
use crate::camera::project;
use crate::layout::{MEDAL_RADIUS, path_point};
use glam::{Mat4, Vec2, Vec3};

/// Centre et rayon (normalisés) du disque d'une médaille à l'écran.
#[allow(clippy::cast_precision_loss, reason = "indice ≤ 24")]
fn screen_disc(index: usize, matrix: Mat4) -> Option<(Vec2, f32)> {
    let center = path_point(index as f32);
    let middle = project(center, matrix)?;
    let edge = project(center + Vec3::X * MEDAL_RADIUS, matrix)?;
    Some((middle, middle.distance(edge)))
}

/// Indice du jalon le plus proche de `ndc` parmi ceux dont le disque le contient.
#[must_use]
pub fn pick(count: usize, matrix: Mat4, ndc: Vec2) -> Option<usize> {
    (0..count)
        .filter_map(|index| screen_disc(index, matrix).map(|disc| (index, disc)))
        .filter(|(_, (center, radius))| center.distance(ndc) <= *radius)
        .min_by(|(_, (a, _)), (_, (b, _))| a.distance(ndc).total_cmp(&b.distance(ndc)))
        .map(|(index, _)| index)
}
