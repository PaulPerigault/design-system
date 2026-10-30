//! Propriétés : aller-retour OKLCH et bornes du gamut (ADR-0006, décision 4).
mod common;

use common::{close, oklch};
use pp_color::{fit_to_gamut, in_srgb_gamut, oklch_to_srgb, srgb_to_oklch};
use proptest::prelude::*;
use proptest::test_runner::FileFailurePersistence;

const ROUND_TRIP_TOLERANCE: f64 = 1e-6;
const HUE_MIN_CHROMA: f64 = 1e-3;
const FULL_TURN: f64 = 360.0;
/// Échecs rejoués à chaque exécution ; le fichier se commite (proptest book).
const REGRESSIONS: &str = "proptest-regressions/properties.txt";

fn hue_distance(a: f64, b: f64) -> f64 {
    let delta = (a - b).abs() % FULL_TURN;
    delta.min(FULL_TURN - delta)
}

proptest! {
    #![proptest_config(ProptestConfig {
        failure_persistence: Some(Box::new(FileFailurePersistence::Direct(REGRESSIONS))),
        ..ProptestConfig::default()
    })]

    #[test]
    fn oklch_round_trip_through_srgb(l in 0.02_f64..0.98, c in 0.0_f64..0.5, h in 0.0_f64..360.0) {
        let color = fit_to_gamut(oklch(l, c, h));
        let back = srgb_to_oklch(oklch_to_srgb(color).unwrap()).unwrap();
        prop_assert!(close(back.lightness(), color.lightness(), ROUND_TRIP_TOLERANCE));
        prop_assert!(close(back.chroma(), color.chroma(), ROUND_TRIP_TOLERANCE));
        if color.chroma() > HUE_MIN_CHROMA {
            // Erreur d'arc = bruit / chroma : la teinte perd en précision près des gris.
            let hue_tolerance = ROUND_TRIP_TOLERANCE.to_degrees() / color.chroma();
            prop_assert!(hue_distance(back.hue(), color.hue()) < hue_tolerance);
        }
    }

    #[test]
    fn fit_to_gamut_lands_in_gamut_and_keeps_lightness_and_hue(
        l in 0.0_f64..=1.0, c in 0.0_f64..1.0, h in -720.0_f64..720.0,
    ) {
        let color = oklch(l, c, h);
        let fitted = fit_to_gamut(color);
        prop_assert!(in_srgb_gamut(fitted));
        prop_assert!(fitted.chroma() <= color.chroma());
        prop_assert!(close(fitted.lightness(), l, 0.0));
        prop_assert!(close(fitted.hue(), h, 0.0));
    }

    #[test]
    fn fit_to_gamut_is_idempotent(l in 0.0_f64..=1.0, c in 0.0_f64..1.0, h in 0.0_f64..360.0) {
        let once = fit_to_gamut(oklch(l, c, h));
        prop_assert_eq!(fit_to_gamut(once), once);
    }

    #[test]
    fn fit_to_gamut_is_tight(l in 0.05_f64..0.95, c in 0.0_f64..1.0, h in 0.0_f64..360.0) {
        let color = oklch(l, c, h);
        let fitted = fit_to_gamut(color);
        if fitted != color {
            let beyond = fitted.with_chroma(fitted.chroma() + 1e-6).unwrap();
            prop_assert!(!in_srgb_gamut(beyond));
        }
    }
}
