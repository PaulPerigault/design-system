use glam::Mat4;
use pp_milestones::camera::{FOV_Y, eye, project, vertical_fov, view_projection};
use pp_milestones::layout::{path_point, path_tangent, ribbon_point};

const EPS: f32 = 1e-4;

#[test]
fn tangent_is_a_unit_vector_toward_the_depth() {
    for s in [-2.0, 0.0, 1.5, 7.0, 23.0] {
        let t = path_tangent(s);
        assert!((t.length() - 1.0).abs() < EPS);
        assert!(t.z < 0.0);
    }
}

#[test]
fn path_is_equidistant_in_depth() {
    let step = path_point(1.0).z - path_point(0.0).z;
    assert!((path_point(5.0).z - path_point(4.0).z - step).abs() < EPS);
}

#[test]
fn ribbon_sits_under_the_medals_and_spans_its_width() {
    let (left, right) = (ribbon_point(2.0, -1.0), ribbon_point(2.0, 1.0));
    assert!(left.y < 0.0 && (left.y - right.y).abs() < EPS);
    assert!((left.distance(right) - 2.0).abs() < EPS);
}

#[test]
fn the_active_milestone_projects_near_the_center() {
    for s in [0.0, 3.0, 11.0] {
        let m = view_projection(s, 1.5);
        let p = project(path_point(s), m).unwrap();
        assert!(p.length() < 0.5, "jalon {s} projeté en {p}");
    }
}

#[test]
fn points_behind_the_eye_do_not_project() {
    let m = view_projection(0.0, 1.0);
    let behind = eye(0.0) - (path_point(0.0) - eye(0.0)).normalize() * 3.0;
    assert_eq!(project(behind, m), None);
}

#[test]
fn narrow_canvases_widen_the_field() {
    assert!((vertical_fov(1.5) - FOV_Y).abs() < EPS);
    assert!(vertical_fov(0.5) > FOV_Y);
    for bad in [0.0, -1.0, f32::NAN, f32::INFINITY] {
        assert!((vertical_fov(bad) - FOV_Y).abs() < EPS);
    }
}

#[test]
fn a_bad_aspect_still_yields_a_finite_matrix() {
    for aspect in [0.0, f32::NAN] {
        let m: Mat4 = view_projection(1.0, aspect);
        assert!(m.to_cols_array().iter().all(|v| v.is_finite()));
    }
}
