//! Propriétés : l'easing reste dans ses bornes et croît, le chemin est continu et borné, la
//! progression et l'étape se correspondent.
use glam::Vec2;
use pp_milestones::CubicBezier;
use pp_milestones::camera::focus;
use pp_milestones::layout::{SPACING, knot, path_point, path_tangent};
use pp_milestones::progress::{nearest, progress_of};
use pp_milestones::tilt::{MAX_TILT, Tilt};
use proptest::prelude::*;

const EPS: f32 = 1e-3;
/// Pas des tests de continuité, vitesse maximale (profondeur, lacet et dénivelé composés, avec marge).
const STEP: f32 = 0.01;
const TINY: f32 = 1e-3;
const MAX_SPEED: f32 = 5.4;

proptest! {
    #[test]
    fn easing_stays_in_unit_range_for_monotonic_curves(
        x1 in 0.0_f32..=1.0, x2 in 0.0_f32..=1.0, y1 in 0.0_f32..=1.0, y2 in 0.0_f32..=1.0,
        x in 0.0_f32..=1.0,
    ) {
        let y = CubicBezier::new(x1, y1, x2, y2).unwrap().ease(x);
        prop_assert!((-EPS..=1.0 + EPS).contains(&y), "ease({x}) = {y}");
    }

    #[test]
    fn easing_is_monotonic_for_monotonic_curves(
        x1 in 0.0_f32..=1.0, x2 in 0.0_f32..=1.0, y1 in 0.0_f32..=1.0, y2 in 0.0_f32..=1.0,
        a in 0.0_f32..=1.0, b in 0.0_f32..=1.0,
    ) {
        let curve = CubicBezier::new(x1, y1, x2, y2).unwrap();
        let (low, high) = if a <= b { (a, b) } else { (b, a) };
        prop_assert!(curve.ease(low) <= curve.ease(high) + EPS);
    }

    #[test]
    fn easing_hits_both_ends(
        x1 in 0.0_f32..=1.0, x2 in 0.0_f32..=1.0, y1 in -2.0_f32..=3.0, y2 in -2.0_f32..=3.0,
    ) {
        let curve = CubicBezier::new(x1, y1, x2, y2).unwrap();
        prop_assert!(curve.ease(0.0).abs() < EPS);
        prop_assert!((curve.ease(1.0) - 1.0).abs() < EPS);
    }

    #[test]
    fn tilt_never_exceeds_its_bound(
        x in -50.0_f32..50.0, y in -50.0_f32..50.0, dt in 0.0_f32..500.0, tau in 0.0_f32..500.0,
    ) {
        let mut tilt = Tilt::default();
        tilt.pointer_move(Vec2::new(x, y));
        tilt.step(dt, tau);
        prop_assert!(tilt.angles().abs().max_element() <= MAX_TILT + EPS);
    }

    #[test]
    fn the_path_is_continuous(s in -2.0_f32..26.0) {
        let (a, b) = (path_point(s), path_point(s + STEP));
        prop_assert!(a.distance(b) <= STEP * MAX_SPEED);
    }

    #[test]
    fn the_path_is_c1_across_segments(i in -1_i16..25) {
        let at = f32::from(i);
        let (before, after) = (path_tangent(at - TINY), path_tangent(at + TINY));
        prop_assert!(before.distance(after) < 1e-2);
        prop_assert!(path_point(at).distance(knot(at)) < EPS);
    }

    #[test]
    fn the_path_advances_in_depth_at_a_near_constant_speed(s in -2.0_f32..26.0) {
        let speed = path_point(s + STEP).distance(path_point(s)) / STEP;
        prop_assert!((SPACING..=MAX_SPEED).contains(&speed), "vitesse {speed}");
        prop_assert!(path_point(s + STEP).z < path_point(s).z, "toujours vers la profondeur");
    }

    #[test]
    fn the_path_stays_inside_its_bounds(s in 0.0_f32..24.0) {
        let p = path_point(s);
        prop_assert!(p.x.abs() <= 1.6 && (-1.0..=10.0).contains(&p.y));
    }

    #[test]
    fn focus_is_a_weight(s in -2.0_f32..26.0) {
        prop_assert!((0.0..=1.0).contains(&focus(s)));
    }

    #[test]
    fn progress_and_stop_correspond(count in 1_usize..=24, goal in any::<bool>(), index in 0_usize..25) {
        let stops = count + usize::from(goal);
        let index = index % stops;
        prop_assert_eq!(nearest(progress_of(index, count, goal), count, goal), index);
    }

    #[test]
    fn nearest_is_monotonic_in_progress(count in 1_usize..=24, a in 0.0_f32..=1.0, b in 0.0_f32..=1.0) {
        let (low, high) = if a <= b { (a, b) } else { (b, a) };
        prop_assert!(nearest(low, count, true) <= nearest(high, count, true));
    }
}
