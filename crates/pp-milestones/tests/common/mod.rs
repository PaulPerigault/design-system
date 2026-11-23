//! Fabriques partagées par les tests d'intégration.
#![allow(dead_code)]
use pp_milestones::{Milestone, MilestonesData, SceneState, Status, THEME_LEN, Theme};

/// Thème de test : sept couleurs OKLCH, durées de 160 et 100 ms, courbe `cubic-bezier(.2, 0, 0, 1)`.
pub fn theme_values() -> Vec<f32> {
    let colors = [
        [1.0, 0.985, 0.004, 270.7],
        [1.0, 0.2, 0.02, 270.7],
        [1.0, 0.45, 0.15, 270.7],
        [1.0, 0.985, 0.004, 270.7],
        [1.0, 0.85, 0.01, 270.7],
        [1.0, 0.55, 0.02, 270.7],
        [1.0, 0.985, 0.004, 270.7],
    ];
    let mut values: Vec<f32> = colors.concat();
    values.extend([160.0, 100.0, 0.2, 0.0, 0.0, 1.0]);
    assert_eq!(values.len(), THEME_LEN);
    values
}

pub fn theme() -> Theme {
    Theme::from_slice(&theme_values()).unwrap()
}

/// Même thème, durées nulles (mouvement réduit).
pub fn still_theme() -> Theme {
    let mut values = theme_values();
    let at = values.len() - 6;
    values.splice(at..at + 2, [0.0, 0.0]);
    Theme::from_slice(&values).unwrap()
}

pub fn milestone(id: &str, status: Status, has_badge: bool) -> Milestone {
    Milestone {
        id: id.to_owned(),
        status,
        has_badge,
    }
}

/// `count` jalons `m0`, `m1`… : pairs obtenus avec badge, impairs planifiés.
pub fn data(count: usize, goal: bool) -> MilestonesData {
    let milestones = (0..count)
        .map(|i| {
            let achieved = i % 2 == 0;
            let status = if achieved {
                Status::Achieved
            } else {
                Status::Planned
            };
            milestone(&format!("m{i}"), status, achieved)
        })
        .collect();
    MilestonesData::new(milestones, goal).unwrap()
}

pub fn state(count: usize) -> SceneState {
    SceneState::new(data(count, true), theme(), None).unwrap()
}
