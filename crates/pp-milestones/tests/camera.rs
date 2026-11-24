use pp_milestones::camera::{
    FOV_Y, Framing, camera_at, camera_for, close_distance, focus, project, vertical_fov,
};
use pp_milestones::layout::{MEDAL_RADIUS, face_normal, path_point, path_tangent, rail_point};
use pp_milestones::progress::{nearest, progress_of};

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

const STOPS: usize = 6;

#[test]
fn close_up_exactly_on_a_stop_and_overview_between() {
    for s in [0.0, 1.0, 4.0] {
        assert!((focus(s) - 1.0).abs() < EPS);
    }
    assert!(focus(0.5).abs() < EPS && focus(2.5).abs() < EPS);
    let close = camera_at(2.0, 1.0, STOPS);
    let far = camera_at(2.5, 1.0, STOPS);
    let near = |c: pp_milestones::camera::Camera, s: f32| c.eye.distance(path_point(s));
    assert!(near(close, 2.0) < near(far, 2.5));
}

#[test]
fn close_up_looks_straight_at_the_face() {
    let camera = camera_at(3.0, 1.0, STOPS);
    let toward_eye = (camera.eye - path_point(3.0)).normalize();
    assert!(toward_eye.dot(face_normal(3.0)) > 1.0 - EPS);
}

/// Marge de chaque côté (6 % de la largeur), en coordonnées normalisées, moins une tolérance.
const EDGE: f32 = 2.0 * 0.06 - 1e-3;
const ASPECTS: [f32; 10] = [0.4, 0.46, 0.7, 0.94, 1.0, 1.15, 1.5, 1.78, 2.0, 2.5];

#[test]
fn the_active_medal_and_the_next_two_stay_in_the_frame_at_every_aspect() {
    for count in [3_usize, 9, 24] {
        let stops = count + 1;
        for aspect in ASPECTS {
            for index in 0..stops {
                let s = f32::from(u16::try_from(index).unwrap());
                let camera = camera_at(s, aspect, stops);
                let matrix = camera.view_projection(aspect);
                let ahead = 2;
                for k in 0..=ahead.min(stops - 1 - index) {
                    let at = path_point(s + f32::from(u16::try_from(k).unwrap()));
                    let (centre, _) = project(at, matrix).unwrap();
                    let (edge, _) = project(at + camera.right() * MEDAL_RADIUS, matrix).unwrap();
                    let half = (edge.x - centre.x).abs();
                    let (rx, ry) = (half, half * aspect);
                    let at_stop = format!("{count} jalons, aspect {aspect}, étape {index}+{k}");
                    assert!(centre.x - rx >= -1.0 + EDGE, "{at_stop} gauche");
                    assert!(centre.x + rx <= 1.0 - EDGE, "{at_stop} droite");
                    assert!(centre.y + ry <= 1.0 - EDGE, "{at_stop} haut");
                    assert!(centre.y - ry >= -1.0 + EDGE, "{at_stop} bas");
                }
            }
        }
    }
}

#[test]
fn the_active_medal_is_the_largest_and_big_at_desktop_aspect() {
    for index in 0..8 {
        let s = f32::from(u16::try_from(index).unwrap());
        let camera = camera_at(s, 0.94, 9);
        let matrix = camera.view_projection(0.94);
        let radius = |k: f32| {
            let at = path_point(s + k);
            let (c, _) = project(at, matrix).unwrap();
            let (e, _) = project(at + camera.right() * MEDAL_RADIUS, matrix).unwrap();
            (e.x - c.x).abs() * 0.94
        };
        assert!(
            radius(0.0) > radius(1.0) && radius(1.0) > radius(2.0),
            "étape {index}"
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

/// Part de la largeur que couvre le rayon du support actif (le badge en couvre 88 % du diamètre).
fn compact_share(aspect: f32, index: usize, stops: usize) -> f32 {
    let s = f32::from(u16::try_from(index).unwrap());
    let camera = camera_for(
        s,
        Framing {
            aspect,
            compact: true,
        },
        stops,
    );
    let matrix = camera.view_projection(aspect);
    let at = path_point(s);
    let (centre, _) = project(at, matrix).unwrap();
    let (edge, _) = project(at + camera.right() * MEDAL_RADIUS, matrix).unwrap();
    assert!(
        centre.x.abs() <= 1.0 && centre.y.abs() <= 1.0,
        "centre hors cadre"
    );
    (edge.x - centre.x).abs()
}

#[test]
fn the_compact_active_support_is_wide_and_inside_the_frame() {
    // Canevas de 324 px à 390 px d'écran : le support couvre au moins 0,62 de la largeur, le
    // badge (88 %) fait 169 px, au-delà des 150 px exigés (0,46 suffit à 390 px). Aspect 0,98 :
    // canevas réel du téléphone avec le panneau ouvert.
    for aspect in [0.4, 0.46, 0.58, 0.7, 0.98] {
        for index in [0_usize, 3, 8] {
            let share = compact_share(aspect, index, 10);
            assert!(share >= 0.46, "aspect {aspect}, étape {index} : {share}");
        }
    }
    for aspect in [0.4, 0.46, 0.58, 0.7] {
        assert!(compact_share(aspect, 3, 10) >= 0.62, "aspect {aspect}");
    }
    for aspect in [1.3, 1.8, 2.5] {
        assert!(compact_share(aspect, 3, 10) > 0.0, "aspect {aspect}");
    }
}
