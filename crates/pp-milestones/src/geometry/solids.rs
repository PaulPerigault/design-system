//! Solides de base : révolution (support de médaille), cercles, anneaux.
use super::mesh::Mesh;
use glam::{Vec2, Vec3};

/// Nombre de segments d'un cercle (ADR-0012 : médailles à 32 segments).
pub const SEGMENTS: usize = 32;
const FULL_TURN: f32 = core::f32::consts::TAU;

/// Angle du segment `k` sur `count`, en radians.
#[must_use]
pub fn angle(k: usize, count: usize) -> f32 {
    FULL_TURN * crate::layout::ordinal(k) / crate::layout::ordinal(count)
}

/// Révolution d'un profil `(rayon, z)` autour de l'axe z. Normales lisses autour de l'axe, plates
/// le long du profil (le profil va de l'axe vers l'extérieur, face avant d'abord).
pub fn lathe(mesh: &mut Mesh, profile: &[(f32, f32)], segments: usize) {
    for pair in profile.windows(2) {
        let &[(r0, z0), (r1, z1)] = pair else {
            continue;
        };
        let slope = Vec2::new(-(z1 - z0), r1 - r0).normalize_or_zero();
        for k in 0..segments {
            let (a, b) = (angle(k, segments), angle(k + 1, segments));
            let corner = |r: f32, z: f32, t: f32| Vec3::new(r * t.cos(), r * t.sin(), z);
            let normal = |t: f32| Vec3::new(slope.x * t.cos(), slope.x * t.sin(), slope.y);
            let ids = [(r0, z0, a), (r1, z1, a), (r1, z1, b), (r0, z0, b)]
                .map(|(r, z, t)| mesh.vertex_at(corner(r, z, t), normal(t)));
            let [ia, ib, ic, id] = ids;
            mesh.triangles.extend([ia, ib, ic, ia, ic, id]);
        }
    }
}

/// Anneau plat dans le plan z constant, normale vers +z (sens trigonométrique).
pub fn annulus(mesh: &mut Mesh, radii: (f32, f32), z: f32) {
    let at = |r: f32, k: usize| Vec2::from_angle(angle(k, SEGMENTS)).extend(0.0) * r + Vec3::Z * z;
    for k in 0..SEGMENTS {
        let n = k + 1;
        mesh.quad(
            at(radii.0, k),
            at(radii.1, k),
            at(radii.1, n),
            at(radii.0, n),
        );
    }
}

/// Cercle de fil de fer dans le plan z constant.
pub fn circle_lines(mesh: &mut Mesh, center: Vec3, radius: f32) {
    for k in 0..SEGMENTS {
        let point = |i: usize| center + Vec2::from_angle(angle(i, SEGMENTS)).extend(0.0) * radius;
        mesh.line(point(k), point(k + 1));
    }
}
