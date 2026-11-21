//! Chemin et repères du monde : positions des jalons, rail, orientation des médailles.
//!
//! Le jalon `i` est à l'abscisse ordinale `i`, l'objectif à `n` (ADR-0013, décision 1). L'unité
//! du monde est le rayon d'une médaille. Les points de contrôle de la spline sont une fonction
//! analytique de l'indice (`knot`) : la courbe existe pour tout `s` réel, y compris avant le
//! premier jalon (amorce du rail), sans tableau. L'écart de profondeur domine le lacet et le
//! dénivelé : `s` approche l'abscisse curviligne à quelques pour cent près (voir les tests).
use crate::spline::catmull_rom;
use glam::{Mat3, Vec3};

/// Distance de profondeur entre deux jalons.
pub const SPACING: f32 = 5.0;
/// Amplitude et phase (radians par jalon) du lacet latéral.
pub const SWAY: f32 = 1.5;
pub const SWAY_PHASE: f32 = 1.0;
/// Dénivelé par jalon : le chemin monte doucement.
pub const RISE: f32 = 0.4;
/// Hauteur du rail sous l'axe des médailles, et demi-largeur du rail.
pub const RAIL_DROP: f32 = 1.45;
pub const RAIL_HALF_WIDTH: f32 = 1.1;
/// Rayon d'une médaille, son épaisseur, et rayon extérieur de l'objectif (même encombrement).
pub const MEDAL_RADIUS: f32 = 1.0;
pub const MEDAL_THICKNESS: f32 = 0.24;
pub const GOAL_RADIUS: f32 = MEDAL_RADIUS;
/// Angle (radians) dont la face des médailles est relevée vers le ciel.
pub const FACE_PITCH: f32 = 0.2;

/// Indice converti en abscisse. Les indices sont bornés (≤ 25) : `u16` suffit, sans conversion
/// avec perte de précision.
#[must_use]
pub fn ordinal(index: usize) -> f32 {
    f32::from(u16::try_from(index).unwrap_or(u16::MAX))
}

/// Point de contrôle `i` : sur le chemin, à hauteur des médailles.
#[must_use]
pub fn knot(i: f32) -> Vec3 {
    Vec3::new(SWAY * (i * SWAY_PHASE).sin(), RISE * i, -i * SPACING)
}

fn segment(s: f32) -> ([Vec3; 4], f32) {
    let base = s.floor();
    let controls = [-1.0, 0.0, 1.0, 2.0].map(|step| knot(base + step));
    (controls, s - base)
}

/// Point du chemin à l'abscisse `s` : passe exactement par `knot(i)` pour `s = i`.
#[must_use]
pub fn path_point(s: f32) -> Vec3 {
    let (controls, t) = segment(s);
    catmull_rom(controls, t).0
}

/// Direction du chemin (norme 1), toujours tournée vers la profondeur.
#[must_use]
pub fn path_tangent(s: f32) -> Vec3 {
    let (controls, t) = segment(s);
    catmull_rom(controls, t).1.normalize_or_zero()
}

/// Horizontale perpendiculaire au chemin (norme 1), vers la droite de la marche.
#[must_use]
pub fn path_across(s: f32) -> Vec3 {
    let tangent = path_tangent(s);
    Vec3::new(-tangent.z, 0.0, tangent.x).normalize_or_zero()
}

/// Point du rail (sous les médailles) à l'abscisse `s`, décalé de `side` dans la largeur.
#[must_use]
pub fn rail_point(s: f32, side: f32) -> Vec3 {
    path_point(s) + path_across(s) * side - Vec3::Y * RAIL_DROP
}

/// Direction de l'œil vue depuis le chemin : en arrière du chemin, relevée de `angle`.
#[must_use]
pub fn elevated_back(s: f32, angle: f32) -> Vec3 {
    (-path_tangent(s) * angle.cos() + Vec3::Y * angle.sin()).normalize_or_zero()
}

/// Normale de la face avant d'une médaille posée à l'abscisse `s`.
#[must_use]
pub fn face_normal(s: f32) -> Vec3 {
    elevated_back(s, FACE_PITCH)
}

/// Repère local de la médaille (x à droite, y en haut, z vers la face avant), sans roulis.
#[must_use]
pub fn medal_basis(s: f32) -> Mat3 {
    let normal = face_normal(s);
    let right = Vec3::Y.cross(normal).normalize_or_zero();
    Mat3::from_cols(right, normal.cross(right), normal)
}
