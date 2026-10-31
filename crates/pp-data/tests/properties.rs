//! Propriétés : bornes et monotonie des quantiles, forme des indices LTTB (ADR-0006, décision 4).
use pp_data::{GroupBy, Operation, aggregate, lttb, quantile, quantiles};
use proptest::prelude::*;
use proptest::test_runner::FileFailurePersistence;

/// Échecs rejoués à chaque exécution ; le fichier se commite (proptest book).
const REGRESSIONS: &str = "proptest-regressions/properties.txt";
const RANGE: f64 = 1e6;
const MAX_LENGTH: usize = 300;

fn values() -> impl Strategy<Value = Vec<f64>> {
    prop::collection::vec(-RANGE..RANGE, 1..MAX_LENGTH)
}

proptest! {
    #![proptest_config(ProptestConfig {
        failure_persistence: Some(Box::new(FileFailurePersistence::Direct(REGRESSIONS))),
        ..ProptestConfig::default()
    })]

    #[test]
    fn quantile_stays_between_min_and_max(values in values(), p in 0.0_f64..=1.0) {
        let q = quantile(&values, p).unwrap();
        let min = values.iter().copied().fold(f64::INFINITY, f64::min);
        let max = values.iter().copied().fold(f64::NEG_INFINITY, f64::max);
        prop_assert!(q >= min && q <= max);
    }

    #[test]
    fn quantile_ends_are_min_and_max(values in values()) {
        let min = values.iter().copied().fold(f64::INFINITY, f64::min);
        let max = values.iter().copied().fold(f64::NEG_INFINITY, f64::max);
        prop_assert_eq!(quantile(&values, 0.0), Ok(min));
        prop_assert_eq!(quantile(&values, 1.0), Ok(max));
    }

    #[test]
    fn quantile_does_not_decrease_with_p(values in values(), a in 0.0_f64..=1.0, b in 0.0_f64..=1.0) {
        let (low, high) = if a <= b { (a, b) } else { (b, a) };
        let q = quantiles(&values, &[low, high]).unwrap();
        prop_assert!(q[0] <= q[1]);
    }

    #[test]
    fn quantile_ignores_the_order_of_the_values(values in values(), p in 0.0_f64..=1.0) {
        let mut reversed = values.clone();
        reversed.reverse();
        prop_assert_eq!(quantile(&values, p), quantile(&reversed, p));
    }

    #[test]
    fn lttb_indices_are_sorted_in_range_and_within_target(
        values in values(),
        target in 2_usize..400,
    ) {
        let present: Vec<Option<f64>> = values.iter().copied().map(Some).collect();
        let xs: Vec<f64> = (0..values.len()).map(|i| f64::from(u32::try_from(i).unwrap())).collect();
        let kept = lttb(&xs, &present, target).unwrap();
        prop_assert!(kept.windows(2).all(|pair| pair[0] < pair[1]));
        prop_assert!(kept.len() <= target && kept.len() <= values.len());
        prop_assert_eq!(kept.first(), Some(&0));
        prop_assert_eq!(kept.last(), Some(&(values.len() - 1)));
    }

    #[test]
    fn aggregate_counts_every_present_value_once(
        points in prop::collection::vec((0_u8..6, prop::option::of(-1000_i32..1000)), 1..MAX_LENGTH),
    ) {
        let labels: Vec<String> = points.iter().map(|(group, _)| format!("g{group}")).collect();
        let values: Vec<Option<f64>> = points.iter().map(|(_, v)| v.map(f64::from)).collect();
        let counts = aggregate(&labels, std::slice::from_ref(&values), GroupBy::Category, Operation::Count).unwrap();
        let sums = aggregate(&labels, std::slice::from_ref(&values), GroupBy::Category, Operation::Sum).unwrap();
        let present = values.iter().flatten().count();
        let counted: f64 = counts.series[0].iter().flatten().sum();
        prop_assert!((counted - f64::from(u32::try_from(present).unwrap())).abs() < 0.5);
        let total: f64 = values.iter().flatten().sum();
        prop_assert!((sums.series[0].iter().flatten().sum::<f64>() - total).abs() < 0.5);
        prop_assert_eq!(counts.labels.len(), counts.series[0].len());
        let mut unique = counts.labels.clone();
        unique.sort();
        unique.dedup();
        prop_assert_eq!(unique.len(), counts.labels.len());
    }

    #[test]
    fn aggregate_min_and_mean_stay_within_the_group_range(
        values in prop::collection::vec(-RANGE..RANGE, 1..MAX_LENGTH),
    ) {
        let labels = vec!["g".to_owned(); values.len()];
        let series = vec![values.iter().copied().map(Some).collect::<Vec<_>>()];
        let at = |operation| aggregate(&labels, &series, GroupBy::Category, operation).unwrap().series[0][0].unwrap();
        let (min, max, mean) = (at(Operation::Min), at(Operation::Max), at(Operation::Mean));
        prop_assert!(min <= mean + RANGE * 1e-9 && mean <= max + RANGE * 1e-9);
        prop_assert!(min <= max);
    }
}
