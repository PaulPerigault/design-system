//! Chemin du ruban : une courbe douce qui s'enfonce dans la profondeur.
//!
//! Positions équidistantes (ADR-0012, décision 1) : le jalon `i` est à l'abscisse curviligne `i`
//! du chemin, la cible finale à l'abscisse `n`. L'unité du monde est le rayon d'une médaille.
use glam::Vec3;

/// Distance entre deux jalons, selon la profondeur.
pub const SPACING: f32 = 5.0;
/// Amplitude latérale de la courbe.
pub const SWAY: f32 = 1.5;
/// Phase de la courbe par jalon (radians) : une demi-ondulation tous les trois jalons environ.
pub const SWAY_PHASE: f32 = 1.0;
/// Hauteur du ruban sous l'axe des médailles.
pub const RIBBON_DROP: f32 = 1.45;
pub const RIBBON_HALF_WIDTH: f32 = 1.1;
/// Rayon d'une médaille et épaisseur de son disque.
pub const MEDAL_RADIUS: f32 = 1.0;
pub const MEDAL_THICKNESS: f32 = 0.24;
/// Rayon extérieur de la cible finale.
pub const GOAL_RADIUS: f32 = 1.35;

/// Point du chemin à l'abscisse `s`, à hauteur des médailles.
#[must_use]
pub fn path_point(s: f32) -> Vec3 {
    Vec3::new(SWAY * (s * SWAY_PHASE).sin(), 0.0, -s * SPACING)
}

/// Direction du chemin (norme 1), toujours tournée vers la profondeur.
#[must_use]
pub fn path_tangent(s: f32) -> Vec3 {
    let dx = SWAY * SWAY_PHASE * (s * SWAY_PHASE).cos();
    Vec3::new(dx, 0.0, -SPACING).normalize_or_zero()
}

/// Point du ruban (sous les médailles) à l'abscisse `s`, décalé de `side` dans la largeur.
#[must_use]
pub fn ribbon_point(s: f32, side: f32) -> Vec3 {
    let tangent = path_tangent(s);
    let across = Vec3::new(-tangent.z, 0.0, tangent.x).normalize_or_zero();
    path_point(s) + across * side - Vec3::Y * RIBBON_DROP
}
