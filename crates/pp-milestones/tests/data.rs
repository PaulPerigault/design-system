mod common;
use common::{data, milestone};
use pp_milestones::data::{MAX_MILESTONES, MIN_MILESTONES};
use pp_milestones::{Emblem, MilestonesData, SceneError, Status, from_columns};

fn strings(items: &[&str]) -> Vec<String> {
    items.iter().map(|s| (*s).to_owned()).collect()
}

#[test]
fn accepts_one_to_twenty_four_milestones() {
    for count in [MIN_MILESTONES, 2, MAX_MILESTONES] {
        assert_eq!(data(count, false).len(), count);
    }
}

#[test]
fn refuses_zero_and_too_many() {
    for count in [0, MAX_MILESTONES + 1] {
        let milestones = (0..count)
            .map(|i| milestone(&format!("m{i}"), Status::Planned, Emblem::Disc))
            .collect();
        assert_eq!(
            MilestonesData::new(milestones, false),
            Err(SceneError::MilestoneCount)
        );
    }
}

#[test]
fn refuses_invalid_and_duplicate_ids() {
    for id in ["", "A", "a b", "a_b", "é"] {
        let one = vec![milestone(id, Status::Planned, Emblem::Disc)];
        assert_eq!(
            MilestonesData::new(one, false),
            Err(SceneError::InvalidId),
            "{id:?}"
        );
    }
    let twice = vec![
        milestone("a", Status::Planned, Emblem::Disc),
        milestone("a", Status::Planned, Emblem::Disc),
    ];
    assert_eq!(
        MilestonesData::new(twice, false),
        Err(SceneError::DuplicateId)
    );
}

#[test]
fn emblem_keys_are_a_closed_set() {
    for emblem in Emblem::ALL {
        assert_eq!(Emblem::parse(emblem.key()), Ok(emblem));
    }
    assert_eq!(Emblem::parse(""), Ok(Emblem::Disc));
    assert_eq!(Emblem::parse("star"), Err(SceneError::UnknownEmblem));
    assert_eq!(Emblem::parse("Disc"), Err(SceneError::UnknownEmblem));
}

#[test]
fn status_is_achieved_or_planned() {
    assert_eq!(Status::parse("achieved"), Ok(Status::Achieved));
    assert_eq!(Status::parse("planned"), Ok(Status::Planned));
    assert_eq!(Status::parse("done"), Err(SceneError::UnknownStatus));
}

#[test]
fn columns_build_the_same_data() {
    let built = from_columns(
        &strings(&["a", "b"]),
        &strings(&["achieved", "planned"]),
        &strings(&["key", ""]),
        true,
    )
    .unwrap();
    assert_eq!(built.len(), 2);
    assert!(built.has_goal());
    assert_eq!(built.index_of("b"), Some(1));
    assert_eq!(built.index_of("z"), None);
    assert_eq!(
        built.milestones().get(1).map(|m| m.emblem),
        Some(Emblem::Disc)
    );
}

#[test]
fn columns_must_have_the_same_length() {
    let result = from_columns(
        &strings(&["a", "b"]),
        &strings(&["achieved"]),
        &strings(&["", ""]),
        false,
    );
    assert_eq!(result, Err(SceneError::LengthMismatch));
}

#[test]
fn every_error_has_a_literal_code() {
    assert_eq!(SceneError::MilestoneCount.code(), "milestone-count");
    assert_eq!(SceneError::UnknownEmblem.to_string(), "unknown-emblem");
}
