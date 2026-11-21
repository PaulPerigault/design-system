//! Contrat de données de la scène : ce que le rendu consomme, rien de plus.
//!
//! Libellés, groupes, dates et liens vivent dans le HTML : le paquet TypeScript les valide, la
//! scène ne les voit jamais. Elle rejoue ici ce qui la concerne (ADR-0012, décision 1).
use crate::error::SceneError;
use crate::kinds::Status;
use crate::progress::stops;

pub const MIN_MILESTONES: usize = 1;
pub const MAX_MILESTONES: usize = 24;
/// Identifiant réservé de l'objectif : le `@` n'est pas valide dans un identifiant de jalon.
pub const GOAL_ID: &str = "@goal";

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Milestone {
    pub id: String,
    pub status: Status,
    /// Vrai si une image de badge est attendue (le jalon est obtenu et le consommateur en fournit
    /// une). Un jalon planifié n'affiche jamais de badge, quelle que soit cette valeur.
    pub has_badge: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MilestonesData {
    milestones: Vec<Milestone>,
    goal: bool,
}

impl MilestonesData {
    /// Valide le nombre de jalons et l'unicité des identifiants.
    ///
    /// # Errors
    /// `MilestoneCount`, `InvalidId` ou `DuplicateId`.
    pub fn new(milestones: Vec<Milestone>, goal: bool) -> Result<Self, SceneError> {
        if !(MIN_MILESTONES..=MAX_MILESTONES).contains(&milestones.len()) {
            return Err(SceneError::MilestoneCount);
        }
        for (index, milestone) in milestones.iter().enumerate() {
            if !is_id(&milestone.id) {
                return Err(SceneError::InvalidId);
            }
            if milestones
                .iter()
                .take(index)
                .any(|other| other.id == milestone.id)
            {
                return Err(SceneError::DuplicateId);
            }
        }
        Ok(Self { milestones, goal })
    }

    #[must_use]
    pub fn milestones(&self) -> &[Milestone] {
        &self.milestones
    }

    /// Vrai si la scène dessine la cible finale.
    #[must_use]
    pub fn has_goal(&self) -> bool {
        self.goal
    }

    #[must_use]
    pub fn len(&self) -> usize {
        self.milestones.len()
    }

    /// Jamais vrai pour une valeur construite : `new` exige au moins un jalon.
    #[must_use]
    pub fn is_empty(&self) -> bool {
        self.milestones.is_empty()
    }

    /// Nombre d'étapes du chemin : les jalons, plus l'objectif.
    #[must_use]
    pub fn stops(&self) -> usize {
        stops(self.len(), self.goal)
    }

    /// Indice d'étape d'un identifiant : un jalon, ou `GOAL_ID` (indice `len()`) s'il y a un objectif.
    #[must_use]
    pub fn index_of(&self, id: &str) -> Option<usize> {
        if id == GOAL_ID {
            return self.goal.then_some(self.len());
        }
        self.milestones
            .iter()
            .position(|milestone| milestone.id == id)
    }

    /// Identifiant de l'étape `index`.
    #[must_use]
    pub fn id_at(&self, index: usize) -> Option<&str> {
        match self.milestones.get(index) {
            Some(milestone) => Some(milestone.id.as_str()),
            None => (self.goal && index == self.len()).then_some(GOAL_ID),
        }
    }
}

fn is_id(text: &str) -> bool {
    !text.is_empty()
        && text
            .bytes()
            .all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || byte == b'-')
}
