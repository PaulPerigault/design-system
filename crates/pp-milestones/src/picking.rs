//! Disque d'une médaille à l'écran : sélection au pointeur et projection des étiquettes.
use crate::camera::{Camera, project};
use crate::layout::MEDAL_RADIUS;
use glam::{Mat4, Vec2, Vec3};

/// Disque projeté, en espace isotrope : y de -1 (bas) à 1 (haut), x de `-aspect` à `aspect`.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Disc {
    pub center: Vec2,
    pub radius: f32,
    /// Profondeur de vue du centre (la plus petite est la plus proche).
    pub depth: f32,
}

/// Disque du point `center` (rayon d'une médaille) ; `None` derrière la caméra.
#[must_use]
pub fn disc(center: Vec3, camera: &Camera, matrix: Mat4, aspect: f32) -> Option<Disc> {
    let iso = |ndc: Vec2| Vec2::new(ndc.x * aspect, ndc.y);
    let (middle, depth) = project(center, matrix)?;
    let (edge, _) = project(center + camera.right() * MEDAL_RADIUS, matrix)?;
    Some(Disc {
        center: iso(middle),
        radius: iso(middle).distance(iso(edge)),
        depth,
    })
}

/// Indice du disque le plus proche de la caméra parmi ceux qui contiennent `ndc`.
#[must_use]
pub fn hit(discs: &[Option<Disc>], ndc: Vec2, aspect: f32) -> Option<usize> {
    let point = Vec2::new(ndc.x * aspect, ndc.y);
    discs
        .iter()
        .enumerate()
        .filter_map(|(index, disc)| disc.map(|d| (index, d)))
        .filter(|(_, d)| d.center.distance(point) <= d.radius)
        .min_by(|(_, a), (_, b)| a.depth.total_cmp(&b.depth))
        .map(|(index, _)| index)
}
