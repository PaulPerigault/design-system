//! Sous-échantillonnage d'une série à trous par LTTB, sans inventer de valeur. Même contrat que
//! `lttb.ts` : premier et dernier point de chaque suite conservés, le premier trou de chaque
//! plage manquante conservé, le budget partagé entre les suites au prorata de leur longueur.
use crate::error::DataError;
use crate::lttb_run::{Point, lttb_run};
use crate::numbers::{MAX_POINTS, PAIR};

/// Suite de points non manquants : `to` exclu.
struct Run {
    from: usize,
    to: usize,
}

fn runs_of(values: &[Option<f64>]) -> Vec<Run> {
    let mut runs = Vec::new();
    let mut start: Option<usize> = None;
    for (index, value) in values.iter().enumerate() {
        match (value, start) {
            (Some(_), None) => start = Some(index),
            (None, Some(from)) => {
                runs.push(Run { from, to: index });
                start = None;
            }
            _ => {}
        }
    }
    if let Some(from) = start {
        runs.push(Run {
            from,
            to: values.len(),
        });
    }
    runs
}

/// Premier indice manquant de chaque plage de trous.
fn gap_starts(values: &[Option<f64>]) -> Vec<usize> {
    let previous = |index: usize| index.checked_sub(1).and_then(|before| values.get(before));
    (0..values.len())
        .filter(|index| {
            values.get(*index).is_some_and(Option::is_none)
                && !matches!(previous(*index), Some(None))
        })
        .collect()
}

fn check(xs: &[f64], values: &[Option<f64>]) -> Result<(), DataError> {
    if xs.len() != values.len() {
        return Err(DataError::LengthMismatch);
    }
    if xs.len() > MAX_POINTS {
        return Err(DataError::TooManyPoints);
    }
    if !xs.iter().all(|x| x.is_finite()) {
        return Err(DataError::NonFiniteAbscissa);
    }
    if values.iter().flatten().any(|y| !y.is_finite()) {
        return Err(DataError::NonFiniteValue);
    }
    Ok(())
}

fn points_of(xs: &[f64], values: &[Option<f64>], run: &Run) -> Vec<Point> {
    let range = run.from..run.to;
    let (xs, values) = (xs.get(range.clone()), values.get(range));
    xs.into_iter()
        .flatten()
        .zip(values.into_iter().flatten())
        .filter_map(|(x, y)| y.map(|y| Point { x: *x, y }))
        .collect()
}

/// Indices croissants à garder pour tracer la série en `target` points au plus.
///
/// `values` porte `None` pour une donnée manquante. Les suites se partagent le budget au prorata de
/// leur longueur. Plus strict que le TypeScript : une ordonnée non finie est refusée (le contrat
/// `Dataset` les écarte déjà à la frontière).
///
/// # Errors
///
/// `LengthMismatch` si `xs` et `values` diffèrent en longueur, `TooManyPoints` au-delà de
/// `MAX_POINTS`, `NonFiniteAbscissa` ou `NonFiniteValue` si un nombre n'est pas fini, `BadTarget`
/// si `target` est inférieur à 2 par suite plus 1 par plage de trous.
pub fn lttb(xs: &[f64], values: &[Option<f64>], target: usize) -> Result<Vec<usize>, DataError> {
    check(xs, values)?;
    let (runs, gaps) = (runs_of(values), gap_starts(values));
    let minimum = runs.len() * PAIR + gaps.len();
    let extra = target.checked_sub(minimum).ok_or(DataError::BadTarget)?;
    let total: usize = runs.iter().map(|run| run.to - run.from).sum();
    let mut kept: Vec<usize> = gaps;
    for run in &runs {
        let size = run.to - run.from;
        let share = extra.saturating_mul(size).checked_div(total).unwrap_or(0);
        let quota = size.min(PAIR + share);
        let points = points_of(xs, values, run);
        kept.extend(
            lttb_run(&points, quota)
                .into_iter()
                .map(|index| index + run.from),
        );
    }
    kept.sort_unstable();
    Ok(kept)
}
