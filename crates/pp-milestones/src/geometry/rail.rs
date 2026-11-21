//! Rail : ruban plat qui suit la spline, avec un repère par étape.
use super::mesh::Mesh;
use super::solids::angle;
use crate::layout::{RAIL_HALF_WIDTH, ordinal, rail_point};
use crate::progress::stops;
use glam::Vec3;

/// Segments du rail par unité d'abscisse (suit la courbe sans facettes visibles).
const STEPS_PER_UNIT: usize = 5;
/// Le rail commence avant la première étape et déborde après la dernière.
pub const LEAD_IN_UNITS: usize = 2;
pub const TAIL_UNITS: usize = 1;
/// Rayon d'un repère, sa hauteur au-dessus du rail, et son nombre de côtés.
pub const MARKER_RADIUS: f32 = 0.22;
pub const MARKER_LIFT: f32 = 0.01;
const MARKER_SIDES: usize = 16;

fn abscissa(step: usize) -> f32 {
    ordinal(step) / ordinal(STEPS_PER_UNIT) - ordinal(LEAD_IN_UNITS)
}

/// Bande de l'abscisse `-LEAD_IN_UNITS` à la dernière étape plus `TAIL_UNITS`, normale vers le haut.
#[must_use]
pub fn rail(count: usize, goal: bool) -> Mesh {
    let mut mesh = Mesh::default();
    let units = stops(count, goal).saturating_sub(1) + LEAD_IN_UNITS + TAIL_UNITS;
    for step in 0..units * STEPS_PER_UNIT {
        let (s0, s1) = (abscissa(step), abscissa(step + 1));
        let edge = |s: f32, side: f32| rail_point(s, side * RAIL_HALF_WIDTH);
        mesh.quad(edge(s0, -1.0), edge(s0, 1.0), edge(s1, 1.0), edge(s1, -1.0));
    }
    mesh
}

/// Repère : disque plat posé sur le rail, centré à l'origine (à placer par une translation).
#[must_use]
pub fn marker() -> Mesh {
    let mut mesh = Mesh::default();
    let at = |k: usize| {
        let (sin, cos) = angle(k, MARKER_SIDES).sin_cos();
        Vec3::new(cos * MARKER_RADIUS, MARKER_LIFT, sin * MARKER_RADIUS)
    };
    for k in 0..MARKER_SIDES {
        mesh.triangle(Vec3::Y * MARKER_LIFT, at(k + 1), at(k));
    }
    mesh
}
