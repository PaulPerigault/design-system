//! Objectif : étoile extrudée en volume plein, avec son contour (sans badge, forme distincte).
use super::medal::FACE_LIFT;
use super::mesh::Mesh;
use super::solids::angle;
use crate::layout::GOAL_RADIUS;
use glam::{Vec2, Vec3};

/// Branches de l'étoile, rayon intérieur (fraction du rayon extérieur) et épaisseur totale.
pub const POINTS: usize = 5;
pub const INNER_RATIO: f32 = 0.45;
pub const DEPTH: f32 = 0.3;
const HALF_DEPTH: f32 = DEPTH / 2.0;

/// Sommets du contour, en alternance extérieur et intérieur, sens trigonométrique, une pointe en haut.
fn outline_points() -> Vec<Vec2> {
    (0..POINTS * 2)
        .map(|k| {
            let radius = if k % 2 == 0 { 1.0 } else { INNER_RATIO } * GOAL_RADIUS;
            Vec2::from_angle(angle(k, POINTS * 2) + core::f32::consts::FRAC_PI_2) * radius
        })
        .collect()
}

/// Volume plein : face avant, face arrière et flancs, normales plates.
#[must_use]
pub fn solid() -> Mesh {
    let mut mesh = Mesh::default();
    let points = outline_points();
    let (front, back) = (Vec3::Z * HALF_DEPTH, Vec3::NEG_Z * HALF_DEPTH);
    for (k, a) in points.iter().enumerate() {
        let b = points.get((k + 1) % points.len()).copied().unwrap_or(*a);
        mesh.triangle(front, a.extend(HALF_DEPTH), b.extend(HALF_DEPTH));
        mesh.triangle(back, b.extend(-HALF_DEPTH), a.extend(-HALF_DEPTH));
        mesh.quad(
            a.extend(-HALF_DEPTH),
            b.extend(-HALF_DEPTH),
            b.extend(HALF_DEPTH),
            a.extend(HALF_DEPTH),
        );
    }
    mesh
}

/// Contour en fil de fer, légèrement en avant des faces pour ne pas se confondre avec elles.
#[must_use]
pub fn outline() -> Mesh {
    let mut mesh = Mesh::default();
    let points = outline_points();
    for z in [HALF_DEPTH + FACE_LIFT, -HALF_DEPTH - FACE_LIFT] {
        for (k, a) in points.iter().enumerate() {
            let b = points.get((k + 1) % points.len()).copied().unwrap_or(*a);
            mesh.line(a.extend(z), b.extend(z));
        }
    }
    mesh
}
