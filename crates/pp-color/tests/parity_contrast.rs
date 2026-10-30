//! Parité du contraste avec la référence TypeScript : rapport WCAG 2 identique à 1e-6 et arrondi à
//! deux décimales identique (ADR-0006), Lc APCA à 1e-6, refus hors gamut identiques.
mod common;
mod vectors;

use common::close;
use pp_color::{ColorError, Srgb, apca_lc, contrast_ratio, parse_hex, rendered_srgb};
use serde_json::Value;
use vectors::{TOLERANCE, color_of, number, vectors};

const CENTI: f64 = 100.0;

fn side(value: &Value) -> Result<Srgb, ColorError> {
    value["hex"]
        .as_str()
        .map_or_else(|| rendered_srgb(color_of(value)), parse_hex)
}

#[test]
fn contrast_matches_reference() {
    let vectors = vectors();
    let cases = vectors["contrasts"].as_array().expect("contrasts");
    assert!(
        cases.len() >= 60,
        "jeu de contrastes trop court : {}",
        cases.len()
    );
    let mut refused = 0;
    for case in cases {
        let (name, fg, bg) = (&case["name"], side(&case["fg"]), side(&case["bg"]));
        let (Ok(fg), Ok(bg)) = (fg, bg) else {
            assert_eq!(case["error"], "out-of-gamut", "{name} : refus inattendu");
            refused += 1;
            continue;
        };
        let ratio = contrast_ratio(fg, bg).unwrap();
        assert!(
            close(ratio, number(&case["ratio"]), TOLERANCE),
            "{name} : ratio {ratio}"
        );
        assert!(
            close((ratio * CENTI).round(), number(&case["centi"]), 0.0),
            "{name} : arrondi"
        );
        let lc = apca_lc(fg, bg).unwrap();
        assert!(
            close(lc, number(&case["lc"]), TOLERANCE),
            "{name} : Lc {lc}"
        );
    }
    assert!(
        refused > 0,
        "aucun cas hors gamut : le refus n'est pas testé"
    );
}
