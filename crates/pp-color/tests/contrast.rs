//! Contraste WCAG 2, APCA et hexadécimal : valeurs de norme, refus typés. La parité complète avec
//! la référence TypeScript est dans `parity.rs`.
mod common;

use common::{close, oklch};
use pp_color::{
    ColorError, Component, Srgb, apca_lc, contrast_ratio, parse_hex, relative_luminance,
    rendered_srgb, to_hex,
};

const TOLERANCE: f64 = 1e-9;

fn hex(text: &str) -> Srgb {
    parse_hex(text).unwrap()
}

#[test]
fn black_on_white_is_21_in_either_order() {
    let (black, white) = (hex("#000000"), hex("#ffffff"));
    assert!(close(
        contrast_ratio(black, white).unwrap(),
        21.0,
        TOLERANCE
    ));
    assert!(close(
        contrast_ratio(white, black).unwrap(),
        21.0,
        TOLERANCE
    ));
    assert!(close(contrast_ratio(white, white).unwrap(), 1.0, TOLERANCE));
}

#[test]
fn luminance_of_white_is_one_and_black_zero() {
    assert!(close(
        relative_luminance(hex("#ffffff")).unwrap(),
        1.0,
        TOLERANCE
    ));
    assert!(close(
        relative_luminance(hex("#000000")).unwrap(),
        0.0,
        TOLERANCE
    ));
}

#[test]
fn apca_is_signed_by_polarity_and_zero_for_equal_colors() {
    let (black, white) = (hex("#000000"), hex("#ffffff"));
    assert!(apca_lc(black, white).unwrap() > 100.0);
    assert!(apca_lc(white, black).unwrap() < -100.0);
    assert!(close(apca_lc(white, white).unwrap(), 0.0, TOLERANCE));
}

#[test]
fn channels_outside_unit_range_are_refused() {
    let low = Srgb::new(-0.1, 0.5, 0.5).unwrap();
    let high = Srgb::new(0.5, 0.5, 1.5).unwrap();
    let white = hex("#ffffff");
    let red = Err(ColorError::OutOfRange(Component::Red));
    assert_eq!(relative_luminance(low), red);
    assert_eq!(contrast_ratio(white, low), red);
    assert_eq!(
        apca_lc(high, white),
        Err(ColorError::OutOfRange(Component::Blue))
    );
}

#[test]
fn out_of_gamut_color_is_not_rendered() {
    assert_eq!(
        rendered_srgb(oklch(0.5, 0.4, 150.0)),
        Err(ColorError::OutOfGamut)
    );
    assert_eq!(to_hex(oklch(0.5, 0.4, 150.0)), Err(ColorError::OutOfGamut));
    assert!(rendered_srgb(oklch(0.5, 0.05, 150.0)).is_ok());
}

#[test]
fn hex_parsing_accepts_only_seven_character_forms() {
    assert_eq!(hex("#FFffFF"), hex("#ffffff"));
    let bad = [
        "",
        "ffffff",
        "#fff",
        "#ffffff0",
        " #ffffff",
        "#gggggg",
        "#+f+f+f",
        "#éééé",
    ];
    for text in bad {
        assert_eq!(parse_hex(text), Err(ColorError::InvalidHex), "{text:?}");
    }
}

#[test]
fn hex_round_trips_through_oklch() {
    for text in ["#000000", "#ffffff", "#336699", "#f9fafd"] {
        let color = pp_color::hex_to_oklch(text).unwrap();
        assert_eq!(to_hex(color).as_deref(), Ok(text));
    }
}
