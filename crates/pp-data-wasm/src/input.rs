//! Lecture des arguments JavaScript : masque des manquants, séries à plat, noms d'opérations.
use crate::fault::Fault;
use pp_data::{DataError, GroupBy, Operation};

/// Valeurs et masque (non nul = manquant) de même longueur → valeurs avec trous.
pub fn optional(values: &[f64], missing: &[u8]) -> Result<Vec<Option<f64>>, Fault> {
    if values.len() != missing.len() {
        return Err(Fault::BadArgument);
    }
    Ok(values
        .iter()
        .zip(missing)
        .map(|(value, gap)| (*gap == 0).then_some(*value))
        .collect())
}

/// Séries à plat (série après série, `count` points chacune) → une liste par série.
pub fn series_of(
    values: &[f64],
    missing: &[u8],
    count: usize,
) -> Result<Vec<Vec<Option<f64>>>, Fault> {
    if count == 0 {
        return Err(DataError::EmptyInput.into());
    }
    if !values.len().is_multiple_of(count) {
        return Err(Fault::BadArgument);
    }
    let flat = optional(values, missing)?;
    Ok(flat.chunks(count).map(<[_]>::to_vec).collect())
}

pub fn grouping(name: &str) -> Result<GroupBy, Fault> {
    match name {
        "category" => Ok(GroupBy::Category),
        "day" => Ok(GroupBy::Day),
        "month" => Ok(GroupBy::Month),
        "year" => Ok(GroupBy::Year),
        _ => Err(Fault::BadArgument),
    }
}

pub fn operation(name: &str) -> Result<Operation, Fault> {
    match name {
        "sum" => Ok(Operation::Sum),
        "mean" => Ok(Operation::Mean),
        "min" => Ok(Operation::Min),
        "max" => Ok(Operation::Max),
        "count" => Ok(Operation::Count),
        "first" => Ok(Operation::First),
        "last" => Ok(Operation::Last),
        _ => Err(Fault::BadArgument),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn mask_marks_missing_values() {
        assert_eq!(
            optional(&[1.0, 0.0, 3.0], &[0, 1, 0]),
            Ok(vec![Some(1.0), None, Some(3.0)])
        );
        assert_eq!(optional(&[1.0], &[0, 0]), Err(Fault::BadArgument));
    }

    #[test]
    fn flat_series_are_cut_every_count_points() {
        let cut = series_of(&[1.0, 2.0, 3.0, 4.0], &[0, 0, 1, 0], 2);
        assert_eq!(
            cut,
            Ok(vec![vec![Some(1.0), Some(2.0)], vec![None, Some(4.0)]])
        );
        assert_eq!(series_of(&[], &[], 2), Ok(vec![]));
        assert_eq!(
            series_of(&[1.0], &[0], 0),
            Err(DataError::EmptyInput.into())
        );
        assert_eq!(
            series_of(&[1.0, 2.0, 3.0], &[0, 0, 0], 2),
            Err(Fault::BadArgument)
        );
    }

    #[test]
    fn names_map_to_enums_and_unknown_names_are_refused() {
        assert_eq!(grouping("month"), Ok(GroupBy::Month));
        assert_eq!(operation("last"), Ok(Operation::Last));
        assert_eq!(grouping("week"), Err(Fault::BadArgument));
        assert_eq!(operation("median"), Err(Fault::BadArgument));
    }
}
