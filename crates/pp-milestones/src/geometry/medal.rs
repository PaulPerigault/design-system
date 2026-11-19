//! Médaille : disque à épaisseur réelle et bord biseauté, axe z, face avant vers +z.
use super::mesh::Mesh;
use super::solids::{SEGMENTS, circle_lines, lathe};
use crate::layout::{MEDAL_RADIUS, MEDAL_THICKNESS};
use glam::Vec3;

/// Largeur du biseau, dans le rayon et dans l'épaisseur.
pub const BEVEL: f32 = 0.09;
/// Nombre de rayons du fil de fer, d'une face à l'autre.
const SPOKES: usize = 8;

const FRONT: f32 = MEDAL_THICKNESS / 2.0;
const BACK: f32 = -FRONT;

/// Corps plein : face avant, biseau, tranche, biseau, face arrière.
#[must_use]
pub fn body() -> Mesh {
    let mut mesh = Mesh::default();
    let profile = [
        (0.0, FRONT),
        (MEDAL_RADIUS - BEVEL, FRONT),
        (MEDAL_RADIUS, FRONT - BEVEL),
        (MEDAL_RADIUS, BACK + BEVEL),
        (MEDAL_RADIUS - BEVEL, BACK),
        (0.0, BACK),
    ];
    lathe(&mut mesh, &profile, SEGMENTS);
    mesh
}

/// Même contour en fil de fer : bords de chaque face, bords du biseau, rayons de la tranche.
#[must_use]
pub fn wire() -> Mesh {
    let mut mesh = Mesh::default();
    let inner = MEDAL_RADIUS - BEVEL;
    for (radius, z) in [
        (inner, FRONT),
        (MEDAL_RADIUS, FRONT - BEVEL),
        (MEDAL_RADIUS, BACK + BEVEL),
        (inner, BACK),
    ] {
        circle_lines(&mut mesh, Vec3::new(0.0, 0.0, z), radius);
    }
    for k in 0..SPOKES {
        let angle = super::solids::angle(k, SPOKES);
        let (x, y) = (angle.cos() * MEDAL_RADIUS, angle.sin() * MEDAL_RADIUS);
        mesh.line(
            Vec3::new(x, y, FRONT - BEVEL),
            Vec3::new(x, y, BACK + BEVEL),
        );
    }
    mesh
}
