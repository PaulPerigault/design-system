//! Valeurs de référence calculées avec `packages/tokens/src/lib/color.ts` (parité formelle : 7b).
mod common;

use common::{close, oklch};
use pp_color::{
    ColorError, Component, Oklch, Srgb, gamma_to_linear, linear_to_gamma, oklch_to_linear_srgb,
    oklch_to_srgb, srgb_to_oklch,
};

const TOLERANCE: f64 = 1e-9;

#[test]
fn oklch_to_srgb_matches_reference() {
    let [r, g, b] = oklch_to_srgb(oklch(0.47, 0.19, 270.7)).unwrap().channels();
    assert!(close(r, 0.215_950_863_031_036_56, TOLERANCE));
    assert!(close(g, 0.285_787_282_958_975, TOLERANCE));
    assert!(close(b, 0.764_590_382_080_624_4, TOLERANCE));
}

#[test]
fn oklch_to_linear_matches_reference() {
    let [r, g, b] = oklch_to_linear_srgb(oklch(0.47, 0.19, 270.7))
        .unwrap()
        .channels();
    assert!(close(r, 0.038_294_057_906_444_454, TOLERANCE));
    assert!(close(g, 0.066_397_879_344_678_51, TOLERANCE));
    assert!(close(b, 0.545_539_931_373_152_5, TOLERANCE));
}

#[test]
fn srgb_to_oklch_matches_reference() {
    let blue = Srgb::new(0.2, 0.4, 0.6).unwrap();
    let color = srgb_to_oklch(blue).unwrap();
    assert!(close(
        color.lightness(),
        0.499_314_452_923_738_77,
        TOLERANCE
    ));
    assert!(close(color.chroma(), 0.098_664_359_657_101_38, TOLERANCE));
    assert!(close(color.hue(), 250.433_053_709_471_2, 1e-7));
}

#[test]
fn greys_have_zero_chroma_and_hue() {
    let grey = srgb_to_oklch(Srgb::new(0.5, 0.5, 0.5).unwrap()).unwrap();
    assert!(close(grey.chroma(), 0.0, 0.0));
    assert!(close(grey.hue(), 0.0, 0.0));
}

#[test]
fn transfer_function_matches_reference_and_is_odd() {
    assert!(close(
        linear_to_gamma(0.5),
        0.735_356_983_052_449_5,
        TOLERANCE
    ));
    assert!(close(
        gamma_to_linear(0.5),
        0.214_041_140_482_232_3,
        TOLERANCE
    ));
    assert!(close(linear_to_gamma(-0.5), -linear_to_gamma(0.5), 0.0));
}

#[test]
fn constructors_refuse_invalid_input() {
    assert_eq!(
        Oklch::new(f64::NAN, 0.1, 0.0),
        Err(ColorError::NonFinite(Component::Lightness))
    );
    assert_eq!(
        Oklch::new(0.5, f64::INFINITY, 0.0),
        Err(ColorError::NonFinite(Component::Chroma))
    );
    assert_eq!(
        Oklch::new(0.5, 0.1, f64::NAN),
        Err(ColorError::NonFinite(Component::Hue))
    );
    assert_eq!(
        Oklch::new(1.1, 0.1, 0.0),
        Err(ColorError::OutOfRange(Component::Lightness))
    );
    assert_eq!(
        Oklch::new(0.5, -0.1, 0.0),
        Err(ColorError::OutOfRange(Component::Chroma))
    );
    assert_eq!(
        Srgb::new(0.0, f64::NAN, 0.0),
        Err(ColorError::NonFinite(Component::Green))
    );
}

#[test]
fn overflowing_conversion_is_an_error_not_infinity() {
    let huge = oklch(0.5, f64::MAX, 30.0);
    assert!(matches!(oklch_to_srgb(huge), Err(ColorError::NonFinite(_))));
}
