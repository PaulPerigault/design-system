//! Aides communes aux tests d'intégration.
use pp_color::Oklch;

pub fn close(actual: f64, expected: f64, tolerance: f64) -> bool {
    (actual - expected).abs() <= tolerance
}

pub fn oklch(l: f64, c: f64, h: f64) -> Oklch {
    Oklch::new(l, c, h).expect("couleur de test valide")
}
