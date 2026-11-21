//! Entrées de la scène : tableaux parallèles et thème, validés par `pp-milestones`.
use crate::convert::Out;
use crate::fault::{Fault, raise};
use pp_milestones::{SceneError, SceneState, Theme, from_columns};
use wasm_bindgen::prelude::wasm_bindgen;

pub(crate) fn build(
    columns: (&[String], &[String], &[u8]),
    goal: bool,
    theme: &[f32],
    active: &str,
) -> Result<SceneState, Fault> {
    let (ids, statuses, badges) = columns;
    let data = from_columns(ids, statuses, badges, goal)?;
    let index = if active.is_empty() {
        None
    } else {
        Some(data.index_of(active).ok_or(SceneError::ActiveIndex)?)
    };
    Ok(SceneState::new(data, Theme::from_slice(theme)?, index)?)
}

/// Valide les entrées sans toucher au canvas : même contrôle que `Scene::new`.
///
/// # Errors
/// Code de la scène (`SceneError::code`) pour une donnée ou un thème invalide.
#[wasm_bindgen(js_name = checkInput)]
#[allow(
    clippy::needless_pass_by_value,
    reason = "wasm-bindgen ne reçoit un tableau de chaînes que par valeur"
)]
pub fn check_input(
    ids: Vec<String>,
    statuses: Vec<String>,
    badges: &[u8],
    goal: bool,
    theme: &[f32],
) -> Out<()> {
    build((&ids, &statuses, badges), goal, theme, "")
        .map(|_| ())
        .map_err(raise)
}
