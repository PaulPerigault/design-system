use pp_milestones::animation::{Tween, lerp};
use pp_milestones::{CubicBezier, SceneError};

const EPS: f32 = 1e-3;

#[test]
fn linear_is_the_identity() {
    for x in [0.0, 0.25, 0.5, 1.0] {
        assert!((CubicBezier::LINEAR.ease(x) - x).abs() < EPS);
    }
}

#[test]
fn bounds_are_exact() {
    let curve = CubicBezier::new(0.2, 0.0, 0.0, 1.0).unwrap();
    assert!(curve.ease(0.0).abs() < EPS);
    assert!((curve.ease(1.0) - 1.0).abs() < EPS);
    assert!(curve.ease(-3.0).abs() < EPS);
    assert!((curve.ease(7.0) - 1.0).abs() < EPS);
}

#[test]
fn matches_the_css_ease_curve() {
    // `ease` = cubic-bezier(0.25, 0.1, 0.25, 1) ; valeur de référence à mi-course : 0,8024.
    let curve = CubicBezier::new(0.25, 0.1, 0.25, 1.0).unwrap();
    assert!((curve.ease(0.5) - 0.802_4).abs() < 1e-3);
}

#[test]
fn refuses_invalid_control_points() {
    for (x1, x2) in [
        (-0.1, 0.5),
        (0.5, 1.1),
        (f32::NAN, 0.5),
        (0.5, f32::INFINITY),
    ] {
        assert_eq!(
            CubicBezier::new(x1, 0.0, x2, 1.0),
            Err(SceneError::ThemeValue)
        );
    }
    assert!(
        CubicBezier::new(0.5, -2.0, 0.5, 3.0).is_ok(),
        "les ordonnées peuvent déborder"
    );
}

#[test]
fn lerp_interpolates() {
    assert!((lerp(2.0, 6.0, 0.25) - 3.0).abs() < EPS);
}

#[test]
fn tween_runs_then_rests() {
    let mut tween = Tween::at(1.0);
    assert!(!tween.is_running(0.0));
    tween.retarget(100.0, 5.0, 200.0, CubicBezier::LINEAR);
    assert!(tween.is_running(150.0));
    assert!((tween.value(200.0) - 3.0).abs() < EPS);
    assert!((tween.value(300.0) - 5.0).abs() < EPS);
    assert!(!tween.is_running(300.0));
}

#[test]
fn tween_retarget_starts_from_the_current_value() {
    let mut tween = Tween::at(0.0);
    tween.retarget(0.0, 10.0, 100.0, CubicBezier::LINEAR);
    tween.retarget(50.0, 0.0, 100.0, CubicBezier::LINEAR);
    assert!((tween.value(50.0) - 5.0).abs() < EPS);
    assert!((tween.target()).abs() < EPS);
}

#[test]
fn zero_duration_jumps() {
    let mut tween = Tween::at(0.0);
    tween.retarget(10.0, 4.0, 0.0, CubicBezier::LINEAR);
    assert!((tween.value(10.0) - 4.0).abs() < EPS);
    assert!(!tween.is_running(10.0));
}
