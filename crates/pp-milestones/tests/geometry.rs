use pp_milestones::geometry::mesh::{FLOATS_PER_VERTEX, Mesh};
use pp_milestones::geometry::pack::{Mode, Pack, Part};
use pp_milestones::geometry::{emblem, medal, ribbon};
use pp_milestones::{Emblem, layout};

const UNIT_TOLERANCE: f32 = 1e-4;

fn assert_valid(mesh: &Mesh, lit: bool) {
    let count = u32::try_from(mesh.vertex_count()).unwrap();
    assert!(mesh.vertices.len().is_multiple_of(FLOATS_PER_VERTEX));
    assert!(mesh.triangles.len().is_multiple_of(3));
    assert!(mesh.lines.len().is_multiple_of(2));
    assert!(
        mesh.triangles.iter().chain(&mesh.lines).all(|&i| i < count),
        "indice hors bornes"
    );
    assert!(mesh.vertices.iter().all(|v| v.is_finite()));
    for index in 0..mesh.vertex_count() {
        let (_, normal) = mesh.vertex(index).unwrap();
        if lit {
            assert!(
                (normal.length() - 1.0).abs() < UNIT_TOLERANCE,
                "normale non unitaire : {normal}"
            );
        }
    }
}

#[test]
fn medal_body_is_closed_and_lit() {
    let body = medal::body();
    assert_valid(&body, true);
    assert_ne!(body.triangles.len(), 0);
    assert_eq!(body.lines.len(), 0);
}

#[test]
fn medal_wire_is_lines_only() {
    let wire = medal::wire();
    assert_valid(&wire, false);
    assert_eq!(wire.triangles.len(), 0);
    assert_ne!(wire.lines.len(), 0);
}

#[test]
fn every_emblem_is_valid_and_in_relief() {
    for kind in Emblem::ALL {
        let mesh = emblem::mesh(kind);
        assert_valid(&mesh, true);
        assert_ne!(mesh.triangles.len(), 0, "{kind:?}");
        let front = layout::MEDAL_THICKNESS / 2.0;
        let (low, high) = (0..mesh.vertex_count())
            .filter_map(|i| mesh.vertex(i))
            .fold((f32::MAX, f32::MIN), |(low, high), (p, _)| {
                (low.min(p.z), high.max(p.z))
            });
        assert!(
            (low - front).abs() < UNIT_TOLERANCE,
            "{kind:?} part de la face avant"
        );
        assert!(
            (high - front - emblem::RELIEF).abs() < UNIT_TOLERANCE,
            "{kind:?} a la hauteur du relief"
        );
    }
}

#[test]
fn emblems_stay_inside_the_medal_face() {
    for kind in Emblem::ALL {
        let mesh = emblem::mesh(kind);
        let reach = (0..mesh.vertex_count())
            .filter_map(|i| mesh.vertex(i))
            .map(|(p, _)| p.truncate().length())
            .fold(0.0_f32, f32::max);
        assert!(
            reach < layout::MEDAL_RADIUS - medal::BEVEL,
            "{kind:?} déborde : {reach}"
        );
    }
}

#[test]
fn ribbon_faces_up_and_goal_is_wire() {
    let band = ribbon::ribbon(5);
    assert_valid(&band, true);
    assert!(
        (0..band.vertex_count())
            .filter_map(|i| band.vertex(i))
            .all(|(_, n)| n.y > 0.99)
    );
    assert_valid(&ribbon::goal(), false);
}

#[test]
fn pack_ranges_cover_every_part_inside_the_index_buffer() {
    let pack = Pack::build(8).unwrap();
    let mut parts = vec![Part::Body, Part::Wire, Part::Ribbon, Part::Goal];
    parts.extend(Emblem::ALL.map(Part::Emblem));
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
fn pack_bytes_match_the_buffers() {
    let pack = Pack::build(3).unwrap();
    assert_eq!(pack.vertex_bytes().len(), pack.vertices().len() * 4);
    assert_eq!(pack.index_bytes().len(), pack.indices().len() * 4);
    let first = pack.vertices().first().copied().unwrap();
    assert_eq!(
        pack.vertex_bytes().get(..4),
        Some(first.to_le_bytes().as_slice())
    );
}

#[test]
fn the_whole_pack_stays_small() {
    let pack = Pack::build(24).unwrap();
    assert!(
        pack.vertices().len() / FLOATS_PER_VERTEX < 20_000,
        "géométrie statique légère"
    );
}
