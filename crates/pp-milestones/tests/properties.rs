//! Propriétés : l'easing reste dans ses bornes et croît, l'interaction ne sort jamais des siennes.
use glam::Vec2;
use pp_milestones::interaction::Interaction;
use pp_milestones::tilt::{MAX_TILT, Tilt};
use pp_milestones::{CubicBezier, Key};
use proptest::prelude::*;

const EPS: f32 = 1e-3;

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
    fn navigation_stays_in_range(
        count in 1_usize..=24, keys in proptest::collection::vec(0_usize..4, 0..40),
    ) {
        let mut state = Interaction::new(count, 0).unwrap();
        for key in keys {
            state.navigate([Key::Next, Key::Previous, Key::First, Key::Last][key]);
            prop_assert!(state.active() < count);
        }
    }
}
