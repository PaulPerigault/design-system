//! Fabriques partagées par les tests d'intégration.
#![allow(dead_code)]
use pp_milestones::{Emblem, Milestone, MilestonesData, SceneState, Status, THEME_LEN, Theme};

/// Thème de test : six couleurs OKLCH, durées de 160 et 100 ms, courbe `cubic-bezier(.2, 0, 0, 1)`.
pub fn theme_values() -> Vec<f32> {
    let colors = [
        [1.0, 0.985, 0.004, 270.7],
        [1.0, 0.2, 0.02, 270.7],
        [1.0, 0.45, 0.15, 270.7],
        [1.0, 0.985, 0.004, 270.7],
        [1.0, 0.85, 0.01, 270.7],
        [1.0, 0.55, 0.02, 270.7],
    ];
    let mut values: Vec<f32> = colors.concat();
    values.extend([160.0, 100.0, 0.2, 0.0, 0.0, 1.0]);
    assert_eq!(values.len(), THEME_LEN);
    values
}

pub fn theme() -> Theme {
    Theme::from_slice(&theme_values()).unwrap()
}

pub fn milestone(id: &str, status: Status, emblem: Emblem) -> Milestone {
    Milestone {
        id: id.to_owned(),
        status,
        emblem,
    }
}

/// `count` jalons `m0`, `m1`… : pairs atteints, impairs prévus.
pub fn data(count: usize, goal: bool) -> MilestonesData {
    let milestones = (0..count)
        .map(|i| {
            let status = if i % 2 == 0 {
                Status::Achieved
            } else {
                Status::Planned
            };
            milestone(&format!("m{i}"), status, Emblem::ALL[i % Emblem::ALL.len()])
        })
        .collect();
    MilestonesData::new(milestones, goal).unwrap()
}

pub fn state(count: usize) -> SceneState {
    SceneState::new(data(count, true), theme(), 0).unwrap()
}
