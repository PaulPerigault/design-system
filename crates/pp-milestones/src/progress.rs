//! Correspondance entre la progression `p` de [0, 1] et les étapes du chemin.
//!
//! Les étapes sont les `n` jalons (indices 0 à `n - 1`) puis l'objectif s'il existe (indice `n`).
//! `p = 0` est la première étape, `p = 1` la dernière ; l'espacement est ordinal, donc uniforme.
use crate::layout::ordinal;

/// Nombre d'étapes : les jalons, plus l'objectif.
#[must_use]
pub fn stops(count: usize, goal: bool) -> usize {
    count + usize::from(goal)
}

/// Abscisse de la dernière étape (0 s'il n'y en a qu'une).
#[must_use]
pub fn end(count: usize, goal: bool) -> f32 {
    ordinal(stops(count, goal).saturating_sub(1))
}

/// Progression de l'étape `index` (bornée à la dernière étape) ; 0 s'il n'y a qu'une étape.
#[must_use]
pub fn progress_of(index: usize, count: usize, goal: bool) -> f32 {
    let last = end(count, goal);
    if last <= 0.0 {
        return 0.0;
    }
    (ordinal(index) / last).clamp(0.0, 1.0)
}

/// Abscisse de la caméra pour la progression `p` (bornée à [0, 1] ; non finie : 0).
#[must_use]
pub fn abscissa(p: f32, count: usize, goal: bool) -> f32 {
    if p.is_finite() {
        p.clamp(0.0, 1.0) * end(count, goal)
    } else {
        0.0
    }
}

/// Étape la plus proche de l'abscisse `s` parmi `stops` étapes (à égalité, la plus ancienne).
#[must_use]
pub fn nearest_to(s: f32, stops: usize) -> usize {
    (0..stops)
        .min_by(|a, b| (ordinal(*a) - s).abs().total_cmp(&(ordinal(*b) - s).abs()))
        .unwrap_or(0)
}

/// Étape la plus proche de la progression `p`.
#[must_use]
pub fn nearest(p: f32, count: usize, goal: bool) -> usize {
    nearest_to(abscissa(p, count, goal), stops(count, goal))
}
