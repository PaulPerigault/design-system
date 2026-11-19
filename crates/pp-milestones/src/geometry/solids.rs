//! Solides de base : révolution (corps de médaille), prismes convexes, barres, anneaux.
use super::mesh::Mesh;
use glam::{Vec2, Vec3};

/// Nombre de segments d'un cercle (ADR-0012 : médailles à 32 segments).
pub const SEGMENTS: usize = 32;
const FULL_TURN: f32 = core::f32::consts::TAU;

/// Angle du segment `k` sur `count`, en radians.
#[allow(
    clippy::cast_precision_loss,
    reason = "k et count sont de petits entiers (≤ 2^20)"
)]
#[must_use]
pub fn angle(k: usize, count: usize) -> f32 {
    FULL_TURN * k as f32 / count as f32
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

/// Prisme droit d'un polygone convexe (sens trigonométrique), de `z0` à `z1` ; sans face
/// arrière : elle est toujours contre la médaille.
pub fn prism(mesh: &mut Mesh, polygon: &[Vec2], z0: f32, z1: f32) {
    let top: Vec<Vec3> = polygon.iter().map(|p| p.extend(z1)).collect();
    if let Some((&first, rest)) = top.split_first() {
        for pair in rest.windows(2) {
            if let &[b, c] = pair {
                mesh.triangle(first, b, c);
            }
        }
    }
    for (k, p) in polygon.iter().enumerate() {
        let next = polygon.get((k + 1) % polygon.len()).copied().unwrap_or(*p);
        mesh.quad(p.extend(z0), next.extend(z0), next.extend(z1), p.extend(z1));
    }
}

/// Barre de largeur `width` entre `a` et `b`.
pub fn bar(mesh: &mut Mesh, a: Vec2, b: Vec2, width: f32, z: (f32, f32)) {
    let side = (b - a).normalize_or_zero().perp() * width * 0.5;
    prism(mesh, &[a - side, b - side, b + side, a + side], z.0, z.1);
}

/// Disque : prisme d'un polygone régulier à `SEGMENTS` côtés.
pub fn disc(mesh: &mut Mesh, center: Vec2, radius: f32, z: (f32, f32)) {
    let polygon: Vec<Vec2> = (0..SEGMENTS)
        .map(|k| center + Vec2::from_angle(angle(k, SEGMENTS)) * radius)
        .collect();
    prism(mesh, &polygon, z.0, z.1);
}

/// Anneau plat (face supérieure et flancs intérieur et extérieur).
pub fn annulus(mesh: &mut Mesh, center: Vec2, radii: (f32, f32), z: (f32, f32)) {
    let at =
        |r: f32, k: usize, z: f32| (center + Vec2::from_angle(angle(k, SEGMENTS)) * r).extend(z);
    for k in 0..SEGMENTS {
        let n = k + 1;
        mesh.quad(
            at(radii.0, k, z.1),
            at(radii.1, k, z.1),
            at(radii.1, n, z.1),
            at(radii.0, n, z.1),
        );
        mesh.quad(
            at(radii.1, k, z.0),
            at(radii.1, n, z.0),
            at(radii.1, n, z.1),
            at(radii.1, k, z.1),
        );
        mesh.quad(
            at(radii.0, n, z.0),
            at(radii.0, k, z.0),
            at(radii.0, k, z.1),
            at(radii.0, n, z.1),
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
