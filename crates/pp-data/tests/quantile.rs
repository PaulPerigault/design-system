//! Quantiles de type 7 : valeurs de R (`quantile(x, p, type = 7)`), bornes et refus.
use pp_data::{DataError, MAX_POINTS, quantile, quantiles};

const ONE_TO_TEN: [f64; 10] = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 10.0];
const EPSILON: f64 = 1e-12;

fn close(actual: Result<f64, DataError>, expected: f64) -> bool {
    actual.is_ok_and(|value| (value - expected).abs() <= EPSILON)
}

#[test]
fn matches_the_values_of_r() {
    assert!(close(quantile(&ONE_TO_TEN, 0.25), 3.25));
    assert!(close(quantile(&ONE_TO_TEN, 0.5), 5.5));
    assert!(close(quantile(&ONE_TO_TEN, 0.9), 9.1));
}

#[test]
fn bounds_and_single_value() {
    assert_eq!(quantile(&[4.0, 2.0, 9.0], 0.0), Ok(2.0));
    assert_eq!(quantile(&[4.0, 2.0, 9.0], 1.0), Ok(9.0));
    assert_eq!(quantile(&[7.0], 0.3), Ok(7.0));
}

#[test]
fn negative_and_repeated_values() {
    assert_eq!(quantile(&[-5.0, -5.0, 0.0, 5.0], 0.5), Ok(-2.5));
}

#[test]
fn several_probabilities_in_one_sort() {
    assert_eq!(
        quantiles(&[1.0, 2.0, 3.0, 4.0], &[0.0, 0.5, 1.0]),
        Ok(vec![1.0, 2.5, 4.0])
    );
    assert_eq!(quantiles(&[1.0], &[]), Ok(Vec::new()));
}

#[test]
fn rejects_empty_non_finite_and_bad_probabilities() {
    assert_eq!(quantile(&[], 0.5), Err(DataError::EmptyInput));
    assert_eq!(
        quantile(&[1.0, f64::NAN], 0.5),
        Err(DataError::NonFiniteValue)
    );
    assert_eq!(
        quantile(&[1.0, f64::INFINITY], 0.5),
        Err(DataError::NonFiniteValue)
    );
    for p in [-0.1, 1.1, f64::NAN, f64::INFINITY] {
        assert_eq!(
            quantile(&[1.0, 2.0], p),
            Err(DataError::BadProbability),
            "p = {p}"
        );
    }
}

#[test]
fn checks_values_before_probabilities() {
    assert_eq!(quantile(&[], -1.0), Err(DataError::EmptyInput));
}

#[test]
fn rejects_more_points_than_the_dataset_contract() {
    let too_many = vec![0.0; MAX_POINTS + 1];
    assert_eq!(quantile(&too_many, 0.5), Err(DataError::TooManyPoints));
    assert_eq!(quantile(&too_many[..MAX_POINTS], 0.5), Ok(0.0));
}
