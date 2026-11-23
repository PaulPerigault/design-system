//! Coche en relief sur le support d'un jalon obtenu sans badge : un motif propre, jamais un faux
//! badge. Deux barres extrudées au-dessus de la face avant, dans le plan local de la médaille.
use super::medal::FRONT;
use super::mesh::Mesh;
use glam::{Vec2, Vec3};

/// Sommets de la coche (pointe basse puis branche haute), en unités de rayon de médaille.
const TICK: [Vec2; 3] = [
    Vec2::new(-0.42, 0.0),
    Vec2::new(-0.14, -0.3),
    Vec2::new(0.42, 0.34),
];
/// Demi-largeur des barres et hauteur du relief au-dessus de la face.
pub const HALF_WIDTH: f32 = 0.075;
pub const RELIEF: f32 = 0.06;

/// Barre extrudée entre `a` et `b` : face haute et quatre flancs, normales plates.
fn bar(mesh: &mut Mesh, a: Vec2, b: Vec2) {
    let side = (b - a).normalize_or_zero().perp() * HALF_WIDTH;
    let ring = [a - side, b - side, b + side, a + side];
    let (low, high) = (FRONT, FRONT + RELIEF);
    let at = |p: Vec2, z: f32| Vec3::new(p.x, p.y, z);
    mesh.quad(
        at(ring[0], high),
        at(ring[1], high),
        at(ring[2], high),
        at(ring[3], high),
    );
    for (p, q) in ring.iter().zip(ring.iter().cycle().skip(1)) {
        mesh.quad(at(*p, low), at(*q, low), at(*q, high), at(*p, high));
    }
}

#[must_use]
pub fn check() -> Mesh {
    let mut mesh = Mesh::default();
    for pair in TICK.windows(2) {
        if let [a, b] = pair {
            bar(&mut mesh, *a, *b);
        }
    }
    mesh
}
