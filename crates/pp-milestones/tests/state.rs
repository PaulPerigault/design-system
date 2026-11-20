mod common;
use common::{data, state, theme};
use glam::Vec2;
use pp_milestones::geometry::pack::{Pack, Part};
use pp_milestones::plan::build;
use pp_milestones::{Key, SceneError, SceneState};

const FAR_FUTURE: f32 = 10_000.0;

#[test]
fn a_fresh_scene_is_at_rest_after_one_frame() {
    let mut scene = state(5);
    let frame = scene.frame(0.0);
    assert!(!frame.animating);
    assert!(!frame.items.is_empty());
}

#[test]
fn selecting_glides_then_rests() {
    let mut scene = state(5);
    scene.frame(0.0);
    scene.set_active(3, 0.0).unwrap();
    assert!(scene.frame(50.0).animating);
    assert!(!scene.frame(FAR_FUTURE).animating);
    assert_eq!(scene.active_id(), Some("m3"));
}

#[test]
fn an_unknown_id_or_index_is_an_error() {
    let mut scene = state(3);
    assert_eq!(
        scene.set_active_id("nope", 0.0),
        Err(SceneError::ActiveIndex)
    );
    assert_eq!(scene.set_active(3, 0.0), Err(SceneError::ActiveIndex));
    assert_eq!(scene.set_active_id("m2", 0.0), Ok(()));
}

#[test]
fn pointer_tilt_keeps_rendering_until_it_arrives() {
    let mut scene = state(3);
    scene.frame(0.0);
    scene.pointer_move(Vec2::new(0.8, 0.2));
    assert!(scene.frame(16.0).animating);
    let mut now = 16.0;
    while scene.frame(now).animating {
        now += 16.0;
        assert!(now < FAR_FUTURE, "l'inclinaison doit converger");
    }
}

#[test]
fn keyboard_navigation_moves_the_camera() {
    let mut scene = state(4);
    assert_eq!(scene.navigate(Key::Next, 0.0), Some(1));
    assert_eq!(scene.navigate(Key::Last, 0.0), Some(3));
    assert_eq!(scene.navigate(Key::Next, 0.0), None);
}

#[test]
fn picking_finds_the_centered_medal_only() {
    let scene = state(5);
    assert_eq!(scene.pick(Vec2::ZERO, 0.0), Some(0));
    assert_eq!(scene.pick(Vec2::new(0.95, 0.95), 0.0), None);
}

#[test]
fn resize_refuses_non_positive_sizes() {
    let mut scene = state(2);
    for (w, h) in [(0.0, 10.0), (10.0, 0.0), (f32::NAN, 1.0), (-1.0, 1.0)] {
        assert_eq!(scene.resize(w, h), Err(SceneError::Viewport));
    }
    assert_eq!(scene.resize(320.0, 180.0), Ok(()));
}

#[test]
fn a_scene_rejects_an_out_of_range_active_index() {
    assert!(SceneState::new(data(2, false), theme(), 2).is_err());
}

#[test]
fn plan_draws_achieved_as_solid_and_planned_as_wire() {
    let pack = Pack::build(4).unwrap();
    let items = build(&data(4, true), &theme(), &pack, 0.0, Vec2::ZERO);
    // m0 et m2 atteints : corps et emblème chacun ; m1 et m3 prévus : un fil de fer chacun.
    assert_eq!(items.iter().filter(|i| i.lit).count(), 4);
    assert_eq!(items.len(), 2 + 4 + 2);
    assert_eq!(pack.range(Part::Wire).map(|r| r.count > 0), Some(true));
}

#[test]
fn without_a_goal_no_target_is_drawn() {
    let pack = Pack::build(2).unwrap();
    let with = build(&data(2, true), &theme(), &pack, 0.0, Vec2::ZERO).len();
    let without = build(&data(2, false), &theme(), &pack, 0.0, Vec2::ZERO).len();
    assert_eq!(with, without + 1);
}
