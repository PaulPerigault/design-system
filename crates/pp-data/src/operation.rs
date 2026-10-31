//! Réductions d'un groupe de valeurs. Mêmes opérations, dans le même ordre, que `operations.ts`.
use crate::numbers::to_f64;

/// Opération appliquée aux valeurs non manquantes de chaque groupe.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Operation {
    Sum,
    Mean,
    Min,
    Max,
    /// Nombre de valeurs non manquantes.
    Count,
    First,
    Last,
}

/// Plus petite valeur : `<` strict, donc la première en cas d'égalité.
fn smallest(first: f64, values: &[f64]) -> f64 {
    values.iter().fold(
        first,
        |best, value| if *value < best { *value } else { best },
    )
}

fn largest(first: f64, values: &[f64]) -> f64 {
    values.iter().fold(
        first,
        |best, value| if *value > best { *value } else { best },
    )
}

/// Réduit les valeurs, dans l'ordre des données ; `None` sans valeur (jamais 0 ni `NaN`, `Count`
/// compris). La somme part de 0 et ajoute dans l'ordre.
pub(crate) fn reduce(operation: Operation, values: &[f64]) -> Option<f64> {
    let (first, last) = (*values.first()?, *values.last()?);
    let sum = values.iter().fold(0.0, |total, value| total + value);
    Some(match operation {
        Operation::Sum => sum,
        Operation::Mean => sum / to_f64(values.len()),
        Operation::Min => smallest(first, values),
        Operation::Max => largest(first, values),
        Operation::Count => to_f64(values.len()),
        Operation::First => first,
        Operation::Last => last,
    })
}
