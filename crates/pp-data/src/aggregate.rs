//! Agrégation d'un jeu de données par catégorie ou par pas de temps. Même contrat que
//! `aggregate.ts` : groupes dans l'ordre de première apparition, `first` et `last` dans l'ordre des
//! données, un groupe sans valeur donne `None`, les erreurs sont contrôlées dans l'ordre forme,
//! valeurs finies, dates.
use std::collections::HashMap;

use crate::calendar::{GroupBy, time_key};
use crate::error::DataError;
use crate::numbers::MAX_POINTS;
use crate::operation::{Operation, reduce};

/// Résultat : un libellé par groupe, et pour chaque série une valeur par groupe.
#[derive(Debug, Clone, PartialEq)]
pub struct Aggregated {
    pub labels: Vec<String>,
    pub series: Vec<Vec<Option<f64>>>,
}

fn check_shape(labels: &[String], series: &[Vec<Option<f64>>]) -> Result<(), DataError> {
    if labels.is_empty() || series.is_empty() {
        return Err(DataError::EmptyInput);
    }
    if labels.len() > MAX_POINTS {
        return Err(DataError::TooManyPoints);
    }
    if series.iter().any(|values| values.len() != labels.len()) {
        return Err(DataError::LengthMismatch);
    }
    let finite = series
        .iter()
        .flatten()
        .flatten()
        .all(|value| value.is_finite());
    if finite {
        Ok(())
    } else {
        Err(DataError::NonFiniteValue)
    }
}

/// Clé de groupe de chaque point : le libellé lui-même, ou sa date tronquée.
fn keys_of(labels: &[String], by: GroupBy) -> Result<Vec<String>, DataError> {
    if by == GroupBy::Category {
        return Ok(labels.to_vec());
    }
    labels
        .iter()
        .map(|text| time_key(by, text).ok_or(DataError::BadDate))
        .collect()
}

/// Libellés distincts dans l'ordre de première apparition, et les indices de chaque groupe.
fn group(keys: Vec<String>) -> (Vec<String>, Vec<Vec<usize>>) {
    let mut position: HashMap<String, usize> = HashMap::new();
    let (mut labels, mut members): (Vec<String>, Vec<Vec<usize>>) = (Vec::new(), Vec::new());
    for (index, key) in keys.into_iter().enumerate() {
        if let Some(known) = position.get(&key).copied() {
            if let Some(list) = members.get_mut(known) {
                list.push(index);
            }
        } else {
            position.insert(key.clone(), labels.len());
            labels.push(key);
            members.push(vec![index]);
        }
    }
    (labels, members)
}

/// Agrège chaque série de `series` (une valeur par libellé de `labels`, `None` si manquante).
///
/// Avec `GroupBy::Category`, `labels` sont des catégories ; sinon des dates ISO 8601 UTC. Le
/// contrôle du type d'axe (`aggregate.bad-axis`) appartient à l'appelant JavaScript.
///
/// # Errors
///
/// `EmptyInput` sans point ou sans série, `TooManyPoints` au-delà de `MAX_POINTS`,
/// `LengthMismatch` si une série n'a pas un point par libellé, `NonFiniteValue` pour une valeur
/// `NaN` ou infinie, `BadDate` si une date n'existe pas au calendrier.
pub fn aggregate(
    labels: &[String],
    series: &[Vec<Option<f64>>],
    by: GroupBy,
    operation: Operation,
) -> Result<Aggregated, DataError> {
    check_shape(labels, series)?;
    let (groups, members) = group(keys_of(labels, by)?);
    let reduced = series
        .iter()
        .map(|values| {
            members
                .iter()
                .map(|indices| {
                    let kept: Vec<f64> = indices
                        .iter()
                        .filter_map(|index| values.get(*index).copied().flatten())
                        .collect();
                    reduce(operation, &kept)
                })
                .collect()
        })
        .collect();
    Ok(Aggregated {
        labels: groups,
        series: reduced,
    })
}
