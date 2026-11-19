//! Emblèmes en relief sur la face avant de la médaille.
use super::mesh::Mesh;
use super::shapes::{self, Shape};
use super::solids::{angle, annulus, bar, disc, prism};
use crate::kinds::Emblem;
use crate::layout::MEDAL_THICKNESS;
use glam::{Mat4, Vec2, Vec3};

/// Hauteur du relief au-dessus de la face avant.
pub const RELIEF: f32 = 0.07;
/// Échelle des coordonnées unitaires sur la face (rayon de la médaille moins le biseau).
pub const EMBLEM_SCALE: f32 = 0.62;

fn extrude(mesh: &mut Mesh, shape: &Shape) {
    let z = (0.0, RELIEF);
    match *shape {
        Shape::Disc { center, radius } => disc(mesh, center, radius, z),
        Shape::Bar { from, to, width } => bar(mesh, from, to, width, z),
        Shape::Poly(points) => prism(mesh, points, z.0, z.1),
        Shape::Ring {
            center,
            inner,
            outer,
        } => annulus(mesh, center, (inner, outer), z),
    }
}

fn gear_teeth(mesh: &mut Mesh) {
    for k in 0..shapes::GEAR_TEETH {
        let direction = Vec2::from_angle(angle(k, shapes::GEAR_TEETH));
        let (from, to) = (
            direction * shapes::GEAR_TOOTH_FROM,
            direction * shapes::GEAR_TOOTH_TO,
        );
        bar(mesh, from, to, shapes::GEAR_TOOTH_WIDTH, (0.0, RELIEF));
    }
}

fn table(emblem: Emblem) -> &'static [Shape] {
    match emblem {
        Emblem::Disc => shapes::DISC,
        Emblem::Check => shapes::CHECK,
        Emblem::Shield => shapes::SHIELD,
        Emblem::Cloud => shapes::CLOUD,
        Emblem::Network => shapes::NETWORK,
        Emblem::Database => shapes::DATABASE,
        Emblem::Code => shapes::CODE,
        Emblem::Key => shapes::KEY,
        Emblem::Gear => shapes::GEAR_CORE,
    }
}

/// Maillage de l'emblème, posé sur la face avant (z = demi-épaisseur) d'une médaille de rayon 1.
#[must_use]
pub fn mesh(emblem: Emblem) -> Mesh {
    let mut unit = Mesh::default();
    for shape in table(emblem) {
        extrude(&mut unit, shape);
    }
    if emblem == Emblem::Gear {
        gear_teeth(&mut unit);
    }
    let place = Mat4::from_translation(Vec3::new(0.0, 0.0, MEDAL_THICKNESS / 2.0))
        * Mat4::from_scale(Vec3::new(EMBLEM_SCALE, EMBLEM_SCALE, 1.0));
    let mut placed = Mesh::default();
    placed.append(&unit, place);
    placed
}
