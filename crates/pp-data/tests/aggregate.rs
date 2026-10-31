//! Agrégation : opérations, ordre des groupes, valeurs manquantes, dates UTC et refus.
use pp_data::{DataError, GroupBy, MAX_POINTS, Operation, aggregate};

fn texts(items: &[&str]) -> Vec<String> {
    items.iter().map(|item| (*item).to_owned()).collect()
}

fn run(
    labels: &[&str],
    values: &[Option<f64>],
    by: GroupBy,
    operation: Operation,
) -> Result<Vec<Option<f64>>, DataError> {
    let result = aggregate(&texts(labels), &[values.to_vec()], by, operation)?;
    Ok(result.series.into_iter().next().unwrap_or_default())
}

const LABELS: [&str; 6] = ["b", "a", "b", "c", "a", "b"];
const VALUES: [Option<f64>; 6] = [Some(1.0), None, Some(4.0), None, Some(-2.5), Some(3.0)];

#[test]
fn every_operation_reduces_in_data_order() {
    let expected = [
        (Operation::Sum, vec![Some(8.0), Some(-2.5), None]),
        (Operation::Mean, vec![Some(8.0 / 3.0), Some(-2.5), None]),
        (Operation::Min, vec![Some(1.0), Some(-2.5), None]),
        (Operation::Max, vec![Some(4.0), Some(-2.5), None]),
        (Operation::Count, vec![Some(3.0), Some(1.0), None]),
        (Operation::First, vec![Some(1.0), Some(-2.5), None]),
        (Operation::Last, vec![Some(3.0), Some(-2.5), None]),
    ];
    for (operation, want) in expected {
        let got = run(&LABELS, &VALUES, GroupBy::Category, operation);
        assert_eq!(got, Ok(want), "{operation:?}");
    }
}

#[test]
fn groups_follow_first_appearance() {
    let result = aggregate(
        &texts(&LABELS),
        &[VALUES.to_vec()],
        GroupBy::Category,
        Operation::Sum,
    );
    assert_eq!(result.map(|r| r.labels), Ok(texts(&["b", "a", "c"])));
}

#[test]
fn a_group_without_value_is_missing_even_for_count() {
    let values = [None, None];
    assert_eq!(
        run(&["a", "a"], &values, GroupBy::Category, Operation::Count),
        Ok(vec![None])
    );
}

#[test]
fn time_groups_read_dates_in_utc() {
    let labels = [
        "2026-01-05",
        "2026-01-20T10:30Z",
        "2026-02-01",
        "2025-12-31T23:59:59Z",
    ];
    let values = [Some(1.0), Some(2.0), Some(3.0), Some(4.0)];
    let month = aggregate(
        &texts(&labels),
        &[values.to_vec()],
        GroupBy::Month,
        Operation::Sum,
    );
    assert_eq!(
        month.as_ref().map(|r| r.labels.clone()),
        Ok(texts(&["2026-01", "2026-02", "2025-12"]))
    );
    let year = aggregate(
        &texts(&labels),
        &[values.to_vec()],
        GroupBy::Year,
        Operation::Count,
    );
    assert_eq!(year.map(|r| r.series), Ok(vec![vec![Some(3.0), Some(1.0)]]));
}

#[test]
fn a_loose_date_takes_the_first_month_or_day() {
    let result = aggregate(
        &texts(&["2026-10", "2026"]),
        &[vec![Some(1.0), Some(2.0)]],
        GroupBy::Day,
        Operation::Sum,
    );
    assert_eq!(
        result.map(|r| r.labels),
        Ok(texts(&["2026-10-01", "2026-01-01"]))
    );
}

#[test]
fn rejects_dates_missing_from_the_calendar() {
    let bad = [
        "2026-02-30",
        "2025-02-29",
        "2026-13-01",
        "2026-00-10",
        "2026-10-00",
        "0099-01-01",
        "26-10-28",
        "2026-1-5",
        "+026-10-28",
        "2026-10-28T09:00",
        "2026-10-28T24:00Z",
        "2026-10-28T09:60Z",
        "2026-10T09:00Z",
        "2026-10-28T09:00:00:00Z",
        "2026-10-28-01",
        "",
        "demain",
        "2026-10-28 09:00Z",
    ];
    for text in bad {
        let result = aggregate(
            &texts(&[text]),
            &[vec![Some(1.0)]],
            GroupBy::Day,
            Operation::Sum,
        );
        assert_eq!(result, Err(DataError::BadDate), "« {text} »");
    }
    for text in [
        "2024-02-29",
        "2000-02-29",
        "2026-12-31T23:59Z",
        "0100-01-01",
    ] {
        let result = aggregate(
            &texts(&[text]),
            &[vec![Some(1.0)]],
            GroupBy::Day,
            Operation::Sum,
        );
        assert!(result.is_ok(), "« {text} »");
    }
}

#[test]
fn rejects_bad_shapes_and_non_finite_values_in_order() {
    let one = [Some(1.0)];
    let by = (GroupBy::Category, Operation::Sum);
    let go = |labels: &[&str], series: &[Vec<Option<f64>>]| {
        aggregate(&texts(labels), series, by.0, by.1).map(|r| r.labels)
    };
    assert_eq!(go(&[], &[vec![]]), Err(DataError::EmptyInput));
    assert_eq!(go(&["a"], &[]), Err(DataError::EmptyInput));
    assert_eq!(
        go(&["a", "b"], &[one.to_vec()]),
        Err(DataError::LengthMismatch)
    );
    assert_eq!(
        go(&["a"], &[vec![Some(f64::NAN)]]),
        Err(DataError::NonFiniteValue)
    );
    assert_eq!(
        go(&["a"], &[vec![Some(f64::INFINITY)]]),
        Err(DataError::NonFiniteValue)
    );
    assert_eq!(
        go(
            &["a", "b"],
            &[vec![Some(f64::NAN)], vec![Some(1.0), Some(2.0)]]
        ),
        Err(DataError::LengthMismatch)
    );
    let long = vec!["a".to_owned(); MAX_POINTS + 1];
    let series = vec![vec![Some(1.0); MAX_POINTS + 1]];
    assert_eq!(
        aggregate(&long, &series, by.0, by.1),
        Err(DataError::TooManyPoints)
    );
}
