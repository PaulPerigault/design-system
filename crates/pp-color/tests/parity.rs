//! Parité avec la référence TypeScript (`packages/tokens`), ADR-0006 décision 4 : écart ≤ 1e-6 sur
//! les composantes. Les vecteurs sont produits par `tools/color/build.mjs` ; la CI vérifie qu'ils
//! sont à jour (`check:color-vectors`). Le contraste est dans `parity_contrast.rs`.
mod common;
mod vectors;

use common::close;
use pp_color::{
    ColorError, Oklch, fit_to_gamut, hex_to_oklch, in_srgb_gamut, oklch_to_linear_srgb,
    oklch_to_srgb, to_hex,
};
use serde_json::Value;
use vectors::{TOLERANCE, color_of, list, number, vectors};

fn all_close(actual: &[f64], expected: &Value) -> bool {
    let expected = list(expected);
    actual.len() == expected.len()
        && actual
            .iter()
            .zip(&expected)
            .all(|(a, e)| close(*a, *e, TOLERANCE))
}

fn same_oklch(actual: Oklch, expected: &Value) -> bool {
    let wanted = ["l", "c", "h"].map(|key| number(&expected[key]));
    all_close(
        &[actual.lightness(), actual.chroma(), actual.hue()],
        &serde_json::json!(wanted),
    )
}

#[test]
fn conversions_match_reference() {
    let vectors = vectors();
    let colors = vectors["colors"].as_array().expect("colors");
    assert!(
        colors.len() >= 90,
        "jeu de couleurs trop court : {}",
        colors.len()
    );
    for case in colors {
        let (name, color) = (&case["name"], color_of(case));
        let srgb = oklch_to_srgb(color).unwrap().channels();
        assert!(all_close(&srgb, &case["srgb"]), "{name} : sRGB {srgb:?}");
        let linear = oklch_to_linear_srgb(color).unwrap().channels();
        assert!(
            all_close(&linear, &case["linear"]),
            "{name} : linéaire {linear:?}"
        );
        assert_eq!(in_srgb_gamut(color), case["inGamut"], "{name} : gamut");
        assert!(
            same_oklch(fit_to_gamut(color), &case["fit"]),
            "{name} : fit_to_gamut"
        );
    }
}

#[test]
fn hex_matches_reference() {
    let vectors = vectors();
    for case in vectors["colors"].as_array().expect("colors") {
        let (name, color) = (&case["name"], color_of(case));
        match case["hex"].as_str() {
            Some(hex) => assert_eq!(to_hex(color).as_deref(), Ok(hex), "{name} : to_hex"),
            None => assert_eq!(
                to_hex(color),
                Err(ColorError::OutOfGamut),
                "{name} : to_hex"
            ),
        }
    }
    for case in vectors["hexes"].as_array().expect("hexes") {
        let hex = case["hex"].as_str().expect("hex");
        let actual = hex_to_oklch(hex).unwrap();
        assert!(
            same_oklch(actual, &case["oklch"]),
            "{hex} : hex_to_oklch {actual:?}"
        );
    }
}
