//! Ruban en perspective et cible finale.
use super::mesh::Mesh;
use super::solids::circle_lines;
use crate::layout::{GOAL_RADIUS, RIBBON_HALF_WIDTH, path_point, ribbon_point};
use glam::Vec3;

/// Pas du ruban : segments par unité d'abscisse curviligne (suit la courbe sans facettes visibles).
const STEPS_PER_UNIT: usize = 6;
/// Le ruban commence avant le premier jalon et finit à la cible.
pub const LEAD_IN_UNITS: usize = 2;
#[allow(clippy::cast_precision_loss, reason = "petit entier")]
const LEAD_IN: f32 = LEAD_IN_UNITS as f32;
/// Rayons des anneaux de la cible, en fractions du rayon extérieur.
const GOAL_RINGS: [f32; 3] = [1.0, 0.66, 0.33];
const GOAL_SPOKES: usize = 4;

#[allow(clippy::cast_precision_loss, reason = "petits entiers (≤ 2^20)")]
fn abscissa(step: usize) -> f32 {
    -LEAD_IN + step as f32 / STEPS_PER_UNIT as f32
}

/// Bande plane de l'abscisse `-LEAD_IN` à `length`, normale vers le haut.
#[must_use]
pub fn ribbon(length: usize) -> Mesh {
    let mut mesh = Mesh::default();
    let steps = (length + LEAD_IN_UNITS) * STEPS_PER_UNIT;
    for step in 0..steps {
        let (s0, s1) = (abscissa(step), abscissa(step + 1));
        let edge = |s: f32, side: f32| ribbon_point(s, side * RIBBON_HALF_WIDTH);
        mesh.quad(edge(s0, -1.0), edge(s0, 1.0), edge(s1, 1.0), edge(s1, -1.0));
    }
    mesh
}

/// Cible : anneaux concentriques et rayons en fil de fer, debout, en bout de ruban.
#[must_use]
pub fn goal() -> Mesh {
    let mut mesh = Mesh::default();
    for fraction in GOAL_RINGS {
        circle_lines(&mut mesh, Vec3::ZERO, GOAL_RADIUS * fraction);
    }
    for k in 0..GOAL_SPOKES {
        let direction = glam::Vec2::from_angle(super::solids::angle(k, GOAL_SPOKES * 2));
        let end = direction.extend(0.0) * GOAL_RADIUS;
        mesh.line(-end, end);
    }
    mesh
}

/// Position de la cible quand il y a `length` jalons.
#[must_use]
#[allow(clippy::cast_precision_loss, reason = "length ≤ 24")]
pub fn goal_position(length: usize) -> Vec3 {
    path_point(length as f32)
}
