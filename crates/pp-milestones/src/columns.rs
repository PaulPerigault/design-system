//! Construction des jalons depuis des tableaux parallèles (la forme qui traverse la frontière).
use crate::data::{Milestone, MilestonesData};
use crate::error::SceneError;
use crate::kinds::{Emblem, Status};

/// Construit les jalons depuis des tableaux parallèles.
///
/// # Errors
/// `LengthMismatch` si les tableaux diffèrent, puis les erreurs de [`MilestonesData::new`] et
/// de `Status::parse` / `Emblem::parse`.
pub fn from_columns(
    ids: &[String],
    statuses: &[String],
    emblems: &[String],
    goal: bool,
) -> Result<MilestonesData, SceneError> {
    if ids.len() != statuses.len() || ids.len() != emblems.len() {
        return Err(SceneError::LengthMismatch);
    }
    let milestones = ids
        .iter()
        .zip(statuses)
        .zip(emblems)
        .map(|((id, status), emblem)| {
            Ok(Milestone {
                id: id.clone(),
                status: Status::parse(status)?,
                emblem: Emblem::parse(emblem)?,
            })
        })
        .collect::<Result<Vec<_>, SceneError>>()?;
    MilestonesData::new(milestones, goal)
}
