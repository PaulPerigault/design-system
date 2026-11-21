use glam::Vec2;
use pp_milestones::geometry::mesh::{FLOATS_PER_VERTEX, Mesh};
use pp_milestones::geometry::pack::{Mode, Pack, Part};
use pp_milestones::geometry::{medal, rail, star};
use pp_milestones::layout::{MEDAL_RADIUS, MEDAL_THICKNESS};

const UNIT: f32 = 1e-4;

fn all(mesh: &Mesh) -> Vec<pp_milestones::geometry::mesh::Vertex> {
    (0..mesh.vertex_count())
        .filter_map(|i| mesh.vertex(i))
        .collect()
}

fn assert_valid(mesh: &Mesh, lit: bool) {
    let count = u32::try_from(mesh.vertex_count()).unwrap();
    assert!(mesh.vertices.len().is_multiple_of(FLOATS_PER_VERTEX));
    assert!(mesh.triangles.len().is_multiple_of(3) && mesh.lines.len().is_multiple_of(2));
    assert!(
        mesh.triangles.iter().chain(&mesh.lines).all(|&i| i < count),
        "indice hors bornes"
    );
    assert!(mesh.vertices.iter().all(|v| v.is_finite()));
    for v in all(mesh) {
        assert!(
            (0.0..=1.0).contains(&v.uv.x) && (0.0..=1.0).contains(&v.uv.y),
            "UV {}",
            v.uv
        );
        assert!(
            !lit || (v.normal.length() - 1.0).abs() < UNIT,
            "normale {}",
            v.normal
        );
    }
}

#[test]
fn the_support_is_closed_and_lit() {
    let support = medal::support();
    assert_valid(&support, true);
    assert!(!support.triangles.is_empty() && support.lines.is_empty());
}

#[test]
fn the_badge_face_covers_exactly_the_uv_square_and_stays_square() {
    let face = medal::badge();
    assert_valid(&face, true);
    let vertices = all(&face);
    let uvs: Vec<Vec2> = vertices.iter().map(|v| v.uv).collect();
    for corner in [Vec2::ZERO, Vec2::X, Vec2::Y, Vec2::ONE] {
        assert!(uvs.contains(&corner), "coin UV {corner}");
    }
    let (min, max) = vertices.iter().fold((Vec2::MAX, Vec2::MIN), |(lo, hi), v| {
        (lo.min(v.position.truncate()), hi.max(v.position.truncate()))
    });
    assert!(
        ((max.x - min.x) - (max.y - min.y)).abs() < UNIT,
        "aspect carré"
    );
    assert!((max.x - medal::badge_half()).abs() < UNIT);
    for v in &vertices {
        let expected = Vec2::new(
            (v.position.x - min.x) / (max.x - min.x),
            1.0 - (v.position.y - min.y) / (max.y - min.y),
        );
        assert!(
            (v.uv - expected).length() < UNIT,
            "UV linéaire, v = 0 en haut"
        );
        assert!(v.normal.z > 1.0 - UNIT, "face avant vers +z");
        assert!(
            v.position.truncate().length() < MEDAL_RADIUS - medal::BEVEL,
            "dans le plat"
        );
        assert!(v.position.z > MEDAL_THICKNESS / 2.0);
    }
    assert_eq!(face.triangles.len(), 6);
}

#[test]
fn ghost_ring_star_and_marker_are_valid() {
    assert_valid(&medal::wire(), false);
    assert_eq!(medal::wire().triangles.len(), 0);
    assert_valid(&medal::ring(), true);
    assert_valid(&star::solid(), true);
    assert_valid(&star::outline(), false);
    assert_eq!(star::outline().triangles.len(), 0);
    assert_valid(&rail::marker(), true);
    assert!(all(&rail::marker()).iter().all(|v| v.normal.y > 1.0 - UNIT));
}

#[test]
fn the_star_is_a_solid_with_a_distinct_silhouette() {
    let points = all(&star::solid());
    let reach = points
        .iter()
        .map(|v| v.position.truncate().length())
        .fold(0.0_f32, f32::max);
    let depth = points.iter().map(|v| v.position.z).fold(0.0_f32, f32::max);
    assert!((reach - pp_milestones::layout::GOAL_RADIUS).abs() < UNIT);
    assert!((depth * 2.0 - star::DEPTH).abs() < UNIT);
    assert_eq!(star::outline().lines.len(), star::POINTS * 2 * 2 * 2);
}

#[test]
fn the_ring_surrounds_the_support() {
    let inner = all(&medal::ring())
        .iter()
        .map(|v| v.position.truncate().length())
        .fold(f32::MAX, f32::min);
    assert!(inner > MEDAL_RADIUS);
}

#[test]
fn the_rail_faces_up_and_grows_with_the_path() {
    let band = rail::rail(5, true);
    assert_valid(&band, true);
    assert!(all(&band).iter().all(|v| v.normal.y > 0.95));
    assert!(rail::rail(6, true).triangles.len() > band.triangles.len());
    assert!(rail::rail(5, false).triangles.len() < band.triangles.len());
}

#[test]
fn pack_ranges_cover_every_part_inside_the_index_buffer() {
    let pack = Pack::build(8, true).unwrap();
    let parts = [
        Part::Support,
        Part::Badge,
        Part::Wire,
        Part::Ring,
        Part::Rail,
        Part::Marker,
        Part::Star,
        Part::StarOutline,
    ];
    let total = pack.indices().len();
    let vertices = u32::try_from(pack.vertices().len() / FLOATS_PER_VERTEX).unwrap();
    for part in parts {
        let range = pack
            .range(part)
            .unwrap_or_else(|| panic!("{part:?} manque"));
        assert!(range.count > 0 && range.first + range.count <= total);
        let unit = if range.mode == Mode::Lines { 2 } else { 3 };
        assert_eq!(range.count % unit, 0);
        assert!(
            pack.indices()[range.first..range.first + range.count]
                .iter()
                .all(|&i| i < vertices)
        );
    }
}

#[test]
fn pack_bytes_match_the_buffers_and_stay_small() {
    let pack = Pack::build(24, true).unwrap();
    assert_eq!(pack.vertex_bytes().len(), pack.vertices().len() * 4);
    assert_eq!(pack.index_bytes().len(), pack.indices().len() * 4);
    let first = pack.vertices().first().copied().unwrap();
    assert_eq!(
        pack.vertex_bytes().get(..4),
        Some(first.to_le_bytes().as_slice())
    );
    assert!(
        pack.vertices().len() / FLOATS_PER_VERTEX < 20_000,
        "géométrie statique légère"
    );
}
