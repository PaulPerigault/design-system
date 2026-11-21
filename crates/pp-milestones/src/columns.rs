//! Construction des jalons depuis des tableaux parallèles (la forme qui traverse la frontière).
use crate::data::{Milestone, MilestonesData};
use crate::error::SceneError;
use crate::kinds::Status;

/// Construit les jalons depuis des tableaux parallèles ; `badges` vaut 1 quand un badge est
/// attendu (toute valeur non nulle), 0 sinon.
///
/// # Errors
/// `LengthMismatch` si les tableaux diffèrent, puis les erreurs de [`MilestonesData::new`] et
/// de `Status::parse`.
pub fn from_columns(
    ids: &[String],
    statuses: &[String],
    badges: &[u8],
    goal: bool,
) -> Result<MilestonesData, SceneError> {
    if ids.len() != statuses.len() || ids.len() != badges.len() {
        return Err(SceneError::LengthMismatch);
    }
    let milestones = ids
        .iter()
        .zip(statuses)
        .zip(badges)
        .map(|((id, status), badge)| {
            Ok(Milestone {
                id: id.clone(),
                status: Status::parse(status)?,
                has_badge: *badge != 0,
            })
        })
        .collect::<Result<Vec<_>, SceneError>>()?;
    MilestonesData::new(milestones, goal)
}
