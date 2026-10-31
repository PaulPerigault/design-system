//! LTTB : cible, bornes, pic isolé, trous et refus.
use pp_data::{DataError, MAX_POINTS, lttb};

/// Suite reproductible de `length` valeurs dans [-50 ; 50[ (congruentiel entier).
fn wave(length: usize) -> Vec<f64> {
    let mut state: u64 = 7;
    (0..length)
        .map(|_| {
            state = (state * 1_103_515_245 + 12_345) % (1 << 31);
            f64::from(u32::try_from(state % 1000).unwrap_or(0)) / 10.0 - 50.0
        })
        .collect()
}

fn steps(length: usize) -> Vec<f64> {
    (0..length)
        .map(|index| f64::from(u32::try_from(index).unwrap_or(0)))
        .collect()
}

fn run(values: &[f64], target: usize) -> Result<Vec<usize>, DataError> {
    let present: Vec<Option<f64>> = values.iter().copied().map(Some).collect();
    lttb(&steps(values.len()), &present, target)
}

#[test]
fn keeps_the_target_and_both_ends() {
    let kept = run(&wave(1000), 100).unwrap();
    assert_eq!(
        (kept.len(), kept.first(), kept.last()),
        (100, Some(&0), Some(&999))
    );
}

#[test]
fn indices_strictly_increase() {
    let kept = run(&wave(1000), 77).unwrap();
    assert!(kept.windows(2).all(|pair| pair[0] < pair[1]));
}

#[test]
fn keeps_an_isolated_spike() {
    let mut values = wave(1000);
    values[500] = 1000.0;
    assert!(run(&values, 50).unwrap().contains(&500));
}

#[test]
fn keeps_everything_under_the_target() {
    assert_eq!(run(&[], 10), Ok(vec![]));
    assert_eq!(run(&[4.0], 10), Ok(vec![0]));
    assert_eq!(run(&[1.0, 2.0, 3.0], 10), Ok(vec![0, 1, 2]));
    assert_eq!(run(&wave(5), 2).unwrap(), vec![0, 4]);
}

#[test]
fn leaves_gaps_where_they_are() {
    let mut values: Vec<Option<f64>> = wave(300).into_iter().map(Some).collect();
    for index in [0, 100, 101, 299] {
        values[index] = None;
    }
    let kept = lttb(&steps(300), &values, 40).unwrap();
    assert!(kept.len() <= 40);
    for gap in [0, 100, 299] {
        assert!(kept.contains(&gap), "début de trou {gap}");
    }
    assert!(!kept.contains(&101), "le trou n'est gardé qu'une fois");
}

#[test]
fn rejects_bad_input() {
    let some = |values: &[f64]| values.iter().copied().map(Some).collect::<Vec<_>>();
    assert_eq!(
        lttb(&[0.0, 1.0], &some(&[1.0]), 5),
        Err(DataError::LengthMismatch)
    );
    assert_eq!(
        lttb(&[0.0, f64::NAN], &some(&[1.0, 2.0]), 5),
        Err(DataError::NonFiniteAbscissa)
    );
    assert_eq!(
        lttb(&[0.0, 1.0], &some(&[1.0, f64::NAN]), 5),
        Err(DataError::NonFiniteValue)
    );
    assert_eq!(
        lttb(&[0.0, 1.0], &some(&[1.0, 2.0]), 1),
        Err(DataError::BadTarget)
    );
    let long = vec![0.0; MAX_POINTS + 1];
    assert_eq!(run(&long, 10), Err(DataError::TooManyPoints));
}

#[test]
fn target_must_cover_two_points_per_run_and_one_per_gap() {
    let values = [Some(1.0), Some(2.0), None, Some(3.0), Some(4.0)];
    let xs = steps(5);
    assert_eq!(lttb(&xs, &values, 4), Err(DataError::BadTarget));
    assert_eq!(lttb(&xs, &values, 5), Ok(vec![0, 1, 2, 3, 4]));
    assert_eq!(lttb(&xs, &values, usize::MAX), Ok(vec![0, 1, 2, 3, 4]));
}
