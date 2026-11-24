mod common;
use common::{data, state, still_theme, theme};
use glam::Vec2;
use pp_milestones::geometry::pack::{Pack, Part};
use pp_milestones::plan::{Inputs, Pose, build};
use pp_milestones::{GOAL_ID, SceneError, SceneState};

const FAR_FUTURE: f32 = 10_000.0;

#[test]
fn a_fresh_scene_is_at_rest_after_one_frame() {
    let mut scene = state(5);
    let frame = scene.frame(0.0);
    assert!(!frame.animating);
    assert!(!frame.items.is_empty());
}

#[test]
fn progress_glides_monotonically_then_rests() {
    let mut scene = state(5);
    scene.frame(0.0);
    scene.set_progress(1.0).unwrap();
    let mut last = 0.0;
    for step in 1..=20_u8 {
        let frame = scene.frame(f32::from(step) * 10.0);
        assert!(frame.animating || step > 16);
        assert!(scene.abscissa() >= last, "lissage monotone");
        assert!(scene.abscissa() <= 5.0);
        last = scene.abscissa();
    }
    assert!(!scene.frame(FAR_FUTURE).animating);
    assert!((scene.abscissa() - 5.0).abs() < 1e-4, "arrive à l'objectif");
}

#[test]
fn zero_duration_jumps_without_a_transition() {
    let mut scene = SceneState::new(data(5, true), still_theme(), None).unwrap();
    scene.frame(0.0);
    scene.set_progress(0.6).unwrap();
    let frame = scene.frame(2.0);
    assert!(!frame.animating, "aucune transition");
    assert!(
        (scene.abscissa() - 3.0).abs() < 1e-4,
        "saut à l'étape 3 sur 5"
    );
}

#[test]
fn a_progress_set_while_idle_still_glides() {
    let mut scene = state(5);
    scene.frame(0.0);
    scene.set_progress(1.0).unwrap();
    assert!(
        scene.frame(FAR_FUTURE).animating,
        "départ à l'horloge de l'image, pas à l'ancienne"
    );
}

#[test]
fn progress_refuses_non_finite_values_and_clamps_the_rest() {
    let mut scene = state(3);
    for bad in [f32::NAN, f32::INFINITY] {
        assert_eq!(scene.set_progress(bad), Err(SceneError::Progress));
    }
    assert_eq!(scene.set_progress(7.0), Ok(()));
}

#[test]
fn ids_map_to_progress_including_the_goal() {
    let scene = state(3);
    assert_eq!(scene.progress_of_id("m0"), Some(0.0));
    assert!(
        scene
            .progress_of_id("m1")
            .is_some_and(|p| (p - 1.0 / 3.0).abs() < 1e-6)
    );
    assert_eq!(scene.progress_of_id(GOAL_ID), Some(1.0));
    assert_eq!(scene.progress_of_id("nope"), None);
    let without = SceneState::new(data(3, false), theme(), None).unwrap();
    assert_eq!(without.progress_of_id(GOAL_ID), None);
}

#[test]
fn active_and_hover_take_known_ids_only() {
    let mut scene = state(3);
    assert!(scene.set_active_id("m2"));
    assert_eq!(scene.active_id(), Some("m2"));
    assert!(!scene.set_active_id("nope"));
    assert_eq!(scene.active_id(), Some("m2"), "inchangé");
    assert!(scene.set_active_id(GOAL_ID));
    assert!(scene.set_active_id(""));
    assert_eq!(scene.active_id(), None);
    scene.set_hover_id("m1");
    scene.set_hover_id("nope");
    scene.set_hover_id("");
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
fn picking_finds_the_active_medal_and_the_goal_by_its_id() {
    let mut scene = state(5);
    scene.frame(0.0);
    let first = scene.project()[0];
    let ndc = Vec2::new(first.x * 2.0 - 1.0, 1.0 - first.y * 2.0);
    assert_eq!(scene.pick(ndc), Some(0));
    assert_eq!(scene.pick(Vec2::new(-0.95, -0.95)), None);
    assert_eq!(scene.id_at(5), Some(GOAL_ID));
    assert_eq!(scene.id_at(6), None);
}

#[test]
fn project_reports_every_stop_and_lowers_the_closeup() {
    let mut scene = state(5);
    scene.set_compact(true);
    scene.resize(390.0, 844.0).unwrap();
    scene.frame(0.0);
    let points = scene.project();
    assert_eq!(points.len(), 6);
    let first = points[0];
    // Cadre étroit : l'active seule est cadrée, un peu au-dessus du centre (place de l'étiquette).
    assert!(first.visible && first.y > 0.3 && first.y < 0.6);
    assert!(first.scale > 0.0);
    assert!(
        points
            .iter()
            .skip(1)
            .all(|p| !p.visible || p.scale < first.scale)
    );
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
    assert!(SceneState::new(data(2, false), theme(), Some(3)).is_err());
}

fn items(count: usize, goal: bool, pose: &Pose) -> Vec<pp_milestones::plan::DrawItem> {
    let (data, theme) = (data(count, goal), theme());
    let pack = Pack::build(count, goal).unwrap();
    build(
        &Inputs {
            data: &data,
            theme: &theme,
            pack: &pack,
        },
        pose,
    )
}

fn pose(s: f32) -> Pose {
    Pose {
        s,
        tilt: Vec2::ZERO,
        tilted: 0,
        hover: None,
        active: None,
    }
}

fn count_of(drawn: &[pp_milestones::plan::DrawItem], part: Part, count: usize) -> usize {
    let range = Pack::build(count, true).unwrap().range(part).unwrap();
    drawn.iter().filter(|i| i.range == range).count()
}

#[test]
fn a_badged_milestone_draws_its_support_without_check() {
    let drawn = items(4, true, &pose(0.0));
    assert_eq!(count_of(&drawn, Part::Support, 4), 2, "m0 et m2");
    assert_eq!(count_of(&drawn, Part::Check, 4), 0, "m0 et m2 ont un badge");
    assert_eq!(
        count_of(&drawn, Part::Wire, 4),
        1,
        "m1 : fantôme, m3 hors cadre"
    );
    assert!(
        drawn
            .iter()
            .filter(|i| i.range == Pack::build(4, true).unwrap().range(Part::Support).unwrap())
            .all(|i| i.lit && !i.fade)
    );
}

#[test]
fn a_milestone_without_badge_draws_support_and_check() {
    let (data, theme) = (
        pp_milestones::MilestonesData::new(
            vec![common::milestone(
                "a",
                pp_milestones::Status::Achieved,
                false,
            )],
            false,
        )
        .unwrap(),
        theme(),
    );
    let pack = Pack::build(1, false).unwrap();
    let inputs = Inputs {
        data: &data,
        theme: &theme,
        pack: &pack,
    };
    let drawn = build(&inputs, &pose(0.0));
    assert_eq!(count_of(&drawn, Part::Support, 1), 1);
    assert_eq!(count_of(&drawn, Part::Check, 1), 1);
    assert_eq!(count_of(&drawn, Part::Ring, 1), 1, "anneau de repos");
}

#[test]
fn hover_keeps_the_projected_centre_and_the_support_matrix() {
    let support = Pack::build(4, true).unwrap().range(Part::Support).unwrap();
    let models = |scene: &mut SceneState, now: f32| {
        let frame = scene.frame(now);
        let all: Vec<_> = frame.items.iter().filter(|i| i.range == support).collect();
        all.iter().map(|i| i.model).collect::<Vec<_>>()
    };
    let mut scene = state(4);
    let (before, rest) = (scene.project(), models(&mut scene, 0.0));
    scene.set_hover_id("m0");
    let hovered = models(&mut scene, 1.0);
    assert_eq!(scene.project(), before);
    assert_eq!(hovered, rest, "ni avancée ni agrandissement au survol");
}

#[test]
fn the_ring_marks_hover_and_active_only() {
    let rings = |pose: &Pose| {
        let ring = Pack::build(4, true).unwrap().range(Part::Ring).unwrap();
        items(4, true, pose)
            .iter()
            .filter(|i| i.range == ring)
            .count()
    };
    assert_eq!(
        rings(&pose(0.0)),
        0,
        "m0 a son badge : pas d'anneau au repos"
    );
    assert_eq!(
        rings(&Pose {
            hover: Some(1),
            active: Some(0),
            ..pose(0.0)
        }),
        2
    );
}

#[test]
fn only_nearby_medals_are_drawn() {
    let far = items(24, true, &pose(0.0)).len();
    let all = items(24, true, &pose(12.0)).len();
    assert!(far < 24 * 3 && all < 24 * 3, "{far} {all}");
}

#[test]
fn only_the_active_stop_and_the_two_following_are_drawn_and_reported() {
    let mut scene = state(8);
    scene.resize(1440.0, 640.0).unwrap();
    scene.frame(0.0);
    let points = scene.project();
    assert!(points.iter().take(3).all(|p| p.visible));
    assert!(points.iter().skip(3).all(|p| !p.visible));
}
