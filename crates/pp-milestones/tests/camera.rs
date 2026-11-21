use glam::Vec2;
use pp_milestones::camera::{FOV_Y, camera_at, close_distance, focus, project, vertical_fov};
use pp_milestones::layout::{MEDAL_RADIUS, face_normal, path_point, path_tangent, rail_point};
use pp_milestones::progress::{nearest, progress_of};

const EPS: f32 = 1e-4;
/// Anneau de survol (1,16 rayon) : doit tenir dans le cadre.
const RING_SCALE: f32 = 1.16;

#[test]
fn tangent_is_a_unit_vector_toward_the_depth() {
    for s in [-2.0, 0.0, 1.5, 7.0, 23.0] {
        let t = path_tangent(s);
        assert!((t.length() - 1.0).abs() < EPS);
        assert!(t.z < 0.0);
    }
}

#[test]
fn rail_sits_under_the_medals_and_spans_its_width() {
    let (left, right) = (rail_point(2.0, -1.0), rail_point(2.0, 1.0));
    assert!(left.y < path_point(2.0).y && (left.y - right.y).abs() < 0.2);
    assert!((left.distance(right) - 2.0).abs() < 0.1);
}

#[test]
fn progress_maps_stops_and_back() {
    for (count, goal) in [(1, false), (1, true), (5, false), (5, true), (24, true)] {
        let stops = count + usize::from(goal);
        for index in 0..stops {
            let p = progress_of(index, count, goal);
            assert!((0.0..=1.0).contains(&p));
            assert_eq!(nearest(p, count, goal), index, "{count} {goal} {index}");
        }
    }
    assert!((progress_of(4, 5, true) - 0.8).abs() < EPS);
    assert!((progress_of(5, 5, true) - 1.0).abs() < EPS);
}

#[test]
fn nearest_clamps_and_survives_bad_input() {
    assert_eq!(nearest(-3.0, 4, true), 0);
    assert_eq!(nearest(9.0, 4, true), 4);
    assert_eq!(nearest(f32::NAN, 4, true), 0);
}

#[test]
fn close_up_exactly_on_a_stop_and_overview_between() {
    for s in [0.0, 1.0, 4.0] {
        assert!((focus(s) - 1.0).abs() < EPS);
    }
    assert!(focus(0.5).abs() < EPS && focus(2.5).abs() < EPS);
    let close = camera_at(2.0, 1.6);
    let far = camera_at(2.5, 1.6);
    let near = |c: pp_milestones::camera::Camera, s: f32| c.eye.distance(path_point(s));
    assert!(near(close, 2.0) < near(far, 2.5));
    assert!(close.target.distance(path_point(2.0)) < EPS);
}

#[test]
fn close_up_looks_straight_at_the_face() {
    let camera = camera_at(3.0, 1.0);
    let toward_eye = (camera.eye - path_point(3.0)).normalize();
    assert!(toward_eye.dot(face_normal(3.0)) > 1.0 - EPS);
}

#[test]
fn the_medal_and_its_ring_stay_inside_the_frame_in_every_format() {
    for (width, height) in [
        (1440.0_f32, 900.0),
        (390.0, 844.0),
        (844.0, 390.0),
        (1024.0, 1024.0),
    ] {
        let aspect = width / height;
        let camera = camera_at(2.0, aspect);
        let matrix = camera.view_projection(aspect);
        let (centre, _) = project(path_point(2.0), matrix).unwrap();
        let (edge, _) = project(
            path_point(2.0) + camera.right() * MEDAL_RADIUS * RING_SCALE,
            matrix,
        )
        .unwrap();
        let radius = Vec2::new((edge.x - centre.x) * aspect, edge.y - centre.y).length();
        assert!(centre.length() < EPS);
        assert!(
            radius < 1.0 / 1.0_f32.max(1.0 / aspect),
            "{width}x{height} : {radius}"
        );
        assert!(
            radius > 0.5 / 1.0_f32.max(1.0 / aspect),
            "{width}x{height} gros plan : {radius}"
        );
    }
}

#[test]
fn the_previous_medal_stays_behind_the_eye() {
    for aspect in [0.46, 1.0, 1.6] {
        assert!(close_distance(aspect) < pp_milestones::layout::SPACING - MEDAL_RADIUS);
    }
}

#[test]
fn narrow_canvases_widen_the_field() {
    assert!((vertical_fov(1.5) - FOV_Y).abs() < EPS);
    assert!(vertical_fov(0.5) > FOV_Y);
    for bad in [0.0, -1.0, f32::NAN, f32::INFINITY] {
        assert!(close_distance(bad).is_finite());
    }
}
