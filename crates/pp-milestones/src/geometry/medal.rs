//! Médaille : support à bord biseauté (axe z, face avant vers +z), fantôme, anneau.
use super::mesh::Mesh;
use super::solids::{SEGMENTS, angle, annulus, circle_lines, lathe};
use crate::layout::{MEDAL_RADIUS, MEDAL_THICKNESS};
use glam::{Vec2, Vec3};

/// Largeur du biseau, dans le rayon et dans l'épaisseur.
pub const BEVEL: f32 = 0.09;
/// Nombre de rayons du fil de fer, d'une face à l'autre.
const SPOKES: usize = 8;
/// Décalage des faces de l'étoile devant son corps : évite le z-fighting (précision de profondeur
/// de l'ordre de 1e-5 à 3 unités).
pub const FACE_LIFT: f32 = 0.004;
/// Écart de l'anneau au bord du support, et sa largeur.
pub const RING_GAP: f32 = 0.05;
pub const RING_WIDTH: f32 = 0.035;

pub const FRONT: f32 = MEDAL_THICKNESS / 2.0;
const BACK: f32 = -FRONT;

/// Support plein, éclairé : face avant plate, biseau, tranche, biseau, face arrière plate.
#[must_use]
pub fn support() -> Mesh {
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

/// Même silhouette en fil de fer, bords de chaque face, du biseau, rayons de tranche.
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
        let direction = Vec2::from_angle(angle(k, SPOKES)) * MEDAL_RADIUS;
        let (top, bottom) = (FRONT - BEVEL, BACK + BEVEL);
        mesh.line(direction.extend(top), direction.extend(bottom));
    }
    mesh
}

/// Anneau autour du bord du support, dans le plan médian (visible de face et de dos).
#[must_use]
pub fn ring() -> Mesh {
    let mut mesh = Mesh::default();
    let inner = MEDAL_RADIUS + RING_GAP;
    annulus(&mut mesh, (inner, inner + RING_WIDTH), 0.0);
    mesh
}
