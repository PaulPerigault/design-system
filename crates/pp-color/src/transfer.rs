//! Fonction de transfert sRGB : IEC 61966-2-1:1999, reprise par CSS Color 4 § 10.2.

const LINEAR_THRESHOLD: f64 = 0.003_130_8;
const GAMMA_THRESHOLD: f64 = 0.040_45;
const LINEAR_SLOPE: f64 = 12.92;
const GAMMA: f64 = 2.4;
const OFFSET: f64 = 0.055;
const SCALE: f64 = 1.0 + OFFSET;

/// sRGB linéaire → gamma ; prolongée par symétrie hors de [0, 1] (CSS Color 4 § 10.2).
#[must_use]
pub fn linear_to_gamma(value: f64) -> f64 {
    let abs = value.abs();
    if abs <= LINEAR_THRESHOLD {
        return value * LINEAR_SLOPE;
    }
    value.signum() * (SCALE * abs.powf(1.0 / GAMMA) - OFFSET)
}

/// sRGB gamma → linéaire ; prolongée par symétrie hors de [0, 1].
#[must_use]
pub fn gamma_to_linear(value: f64) -> f64 {
    let abs = value.abs();
    if abs <= GAMMA_THRESHOLD {
        return value / LINEAR_SLOPE;
    }
    value.signum() * ((abs + OFFSET) / SCALE).powf(GAMMA)
}
