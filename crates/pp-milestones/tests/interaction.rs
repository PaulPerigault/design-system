use glam::Vec2;
use pp_milestones::SceneError;
use pp_milestones::interaction::Interaction;
use pp_milestones::tilt::{MAX_TILT, Tilt};

const EPS: f32 = 1e-3;

#[test]
fn active_must_be_in_range() {
    assert_eq!(Interaction::new(3, Some(3)), Err(SceneError::ActiveIndex));
    assert!(Interaction::new(3, Some(2)).is_ok());
    assert!(Interaction::new(0, None).is_ok());
}

#[test]
fn active_and_hover_are_independent_and_clearable() {
    let mut state = Interaction::new(3, None).unwrap();
    assert_eq!(state.set_active(Some(2)), Ok(()));
    assert_eq!(state.set_active(Some(3)), Err(SceneError::ActiveIndex));
    assert_eq!(state.active(), Some(2));
    state.set_hover(Some(1));
    state.set_hover(Some(9));
    assert_eq!(state.hover(), None, "hors du tableau : effacé");
    state.set_hover(Some(0));
    assert_eq!((state.active(), state.hover()), (Some(2), Some(0)));
    assert_eq!(state.set_active(None), Ok(()));
    assert_eq!(state.active(), None);
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
