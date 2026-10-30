mod common;

use common::{close, oklch};
use pp_color::{ColorError, Component, fit_to_gamut, in_srgb_gamut, in_srgb_gamut_within};

#[test]
fn in_gamut_color_is_untouched() {
    let color = oklch(0.47, 0.19, 270.7);
    assert!(in_srgb_gamut(color));
    assert_eq!(fit_to_gamut(color), color);
}

#[test]
fn out_of_gamut_color_loses_chroma_only() {
    let color = oklch(0.7, 0.4, 150.0);
    assert!(!in_srgb_gamut(color));
    let fitted = fit_to_gamut(color);
    assert!(in_srgb_gamut(fitted));
    assert!(close(fitted.chroma(), 0.192_782_640_457_153_15, 1e-9));
    assert!(close(fitted.lightness(), 0.7, 0.0));
    assert!(close(fitted.hue(), 150.0, 0.0));
}

#[test]
fn tolerance_is_validated_and_widens_the_gamut() {
    let color = oklch(0.7, 0.4, 150.0);
    assert_eq!(in_srgb_gamut_within(color, 10.0), Ok(true));
    assert_eq!(in_srgb_gamut_within(color, 0.0), Ok(false));
    assert_eq!(
        in_srgb_gamut_within(color, -1.0),
        Err(ColorError::OutOfRange(Component::Epsilon))
    );
    assert_eq!(
        in_srgb_gamut_within(color, f64::NAN),
        Err(ColorError::NonFinite(Component::Epsilon))
    );
}

#[test]
fn black_and_white_are_in_gamut() {
    assert!(in_srgb_gamut(oklch(0.0, 0.0, 0.0)));
    assert!(in_srgb_gamut(oklch(1.0, 0.0, 0.0)));
}
