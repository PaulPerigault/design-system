use glam::Vec2;
use pp_milestones::interaction::Interaction;
use pp_milestones::tilt::{MAX_TILT, Tilt};
use pp_milestones::{Key, SceneError};

const EPS: f32 = 1e-3;

#[test]
fn active_must_be_in_range() {
    assert_eq!(Interaction::new(3, 3), Err(SceneError::ActiveIndex));
    assert!(Interaction::new(3, 2).is_ok());
    assert_eq!(Interaction::new(0, 0), Err(SceneError::ActiveIndex));
}

#[test]
fn navigation_clamps_at_both_ends() {
    let mut state = Interaction::new(3, 0).unwrap();
    assert_eq!(state.navigate(Key::Previous), None);
    assert_eq!(state.navigate(Key::Next), Some(1));
    assert_eq!(state.navigate(Key::Last), Some(2));
    assert_eq!(state.navigate(Key::Next), None);
    assert_eq!(state.navigate(Key::First), Some(0));
    assert_eq!(state.navigate(Key::First), None);
}

#[test]
fn set_active_reports_a_change() {
    let mut state = Interaction::new(3, 0).unwrap();
    assert_eq!(state.set_active(2), Ok(true));
    assert_eq!(state.set_active(2), Ok(false));
    assert_eq!(state.set_active(3), Err(SceneError::ActiveIndex));
    assert_eq!(state.active(), 2);
}

#[test]
fn tilt_converges_then_settles() {
    let mut tilt = Tilt::default();
    tilt.pointer_move(Vec2::new(1.0, -1.0));
    assert!(!tilt.settled());
    for _ in 0..200 {
        tilt.step(16.0, 100.0);
    }
    assert!(tilt.settled());
    assert!(
        (tilt.angles() - Vec2::new(MAX_TILT, -MAX_TILT))
            .abs()
            .max_element()
            < EPS
    );
}

#[test]
fn zero_time_constant_is_immediate() {
    let mut tilt = Tilt::default();
    tilt.pointer_move(Vec2::new(0.5, 0.5));
    tilt.step(16.0, 0.0);
    assert!(tilt.settled());
}

#[test]
fn pointer_is_clamped_and_non_finite_ignored() {
    let mut tilt = Tilt::default();
    tilt.pointer_move(Vec2::new(9.0, -9.0));
    tilt.step(1.0, 0.0);
    assert!(
        (tilt.angles() - Vec2::new(MAX_TILT, -MAX_TILT))
            .abs()
            .max_element()
            < EPS
    );
    tilt.pointer_move(Vec2::new(f32::NAN, 0.0));
    tilt.step(1.0, 0.0);
    assert!(
        (tilt.angles().x - MAX_TILT).abs() < EPS,
        "la valeur non finie est ignorée"
    );
}

#[test]
fn gyro_takes_over_then_hands_back() {
    let mut tilt = Tilt::default();
    tilt.pointer_move(Vec2::new(1.0, 0.0));
    tilt.set_gyro(Some(Vec2::new(-1.0, 0.0)));
    tilt.step(1.0, 0.0);
    assert!(tilt.angles().x < 0.0);
    tilt.set_gyro(None);
    tilt.step(1.0, 0.0);
    assert!(tilt.angles().x > 0.0);
    tilt.pointer_leave();
    tilt.step(1.0, 0.0);
    assert!(tilt.angles().x.abs() < EPS);
}
