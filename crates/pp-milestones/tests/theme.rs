mod common;
use common::theme_values;
use pp_color::{Oklch, fit_to_gamut, oklch_to_srgb};
use pp_milestones::theme::{COLOR_STRIDE, MAX_DURATION_MS, SPACE_SRGB};
use pp_milestones::{SceneError, Slot, THEME_LEN, Theme};

const PARITY: f64 = 1e-6;

#[test]
fn oklch_colors_match_pp_color() {
    let values = theme_values();
    let theme = Theme::from_slice(&values).unwrap();
    let slots = [
        Slot::Bg,
        Slot::Fg,
        Slot::Accent,
        Slot::OnAccent,
        Slot::Line,
        Slot::Muted,
    ];
    for (index, slot) in slots.into_iter().enumerate() {
        let at = index * COLOR_STRIDE;
        let (l, c, h) = (values[at + 1], values[at + 2], values[at + 3]);
        let source = Oklch::new(f64::from(l), f64::from(c), f64::from(h)).unwrap();
        let expected = oklch_to_srgb(fit_to_gamut(source)).unwrap();
        for (got, want) in theme.color(slot).into_iter().zip(expected.channels()) {
            assert!(
                (f64::from(got) - want.clamp(0.0, 1.0)).abs() < PARITY,
                "{slot:?}"
            );
        }
    }
}

#[test]
fn srgb_colors_pass_through_clamped() {
    let mut values = theme_values();
    values.splice(0..COLOR_STRIDE, [SPACE_SRGB, 0.25, 1.5, -0.5]);
    let theme = Theme::from_slice(&values).unwrap();
    assert_eq!(theme.color(Slot::Bg), [0.25, 1.0, 0.0]);
}

#[test]
fn durations_and_curve_are_read() {
    let theme = Theme::from_slice(&theme_values()).unwrap();
    assert!((theme.duration_base - 160.0).abs() < 1e-3);
    assert!((theme.duration_fast - 100.0).abs() < 1e-3);
    assert!((theme.easing.ease(1.0) - 1.0).abs() < 1e-3);
}

#[test]
fn reduced_motion_durations_of_zero_are_valid() {
    let mut values = theme_values();
    let end = values.len() - 6;
    values.splice(end..end + 2, [0.0, 0.0]);
    let theme = Theme::from_slice(&values).unwrap();
    assert!(theme.duration_base.abs() < 1e-6);
}

#[test]
fn refuses_a_wrong_length() {
    for len in [0, THEME_LEN - 1, THEME_LEN + 1] {
        assert_eq!(
            Theme::from_slice(&vec![0.0; len]),
            Err(SceneError::ThemeLength)
        );
    }
}

#[test]
fn refuses_bad_values() {
    let cases: [(usize, f32, SceneError); 6] = [
        (0, 2.0, SceneError::ThemeColor),
        (1, f32::NAN, SceneError::ThemeValue),
        (1, 1.5, SceneError::ThemeColor),
        (THEME_LEN - 6, -1.0, SceneError::ThemeValue),
        (THEME_LEN - 5, MAX_DURATION_MS + 1.0, SceneError::ThemeValue),
        (THEME_LEN - 4, 2.0, SceneError::ThemeValue),
    ];
    for (at, value, error) in cases {
        let mut values = theme_values();
        values[at] = value;
        assert_eq!(
            Theme::from_slice(&values),
            Err(error),
            "indice {at} = {value}"
        );
    }
}

#[test]
fn a_negative_chroma_is_refused() {
    let mut values = theme_values();
    values[2] = -0.1;
    assert_eq!(Theme::from_slice(&values), Err(SceneError::ThemeColor));
}
