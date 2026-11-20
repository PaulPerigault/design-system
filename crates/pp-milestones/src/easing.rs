//! Courbe de Bézier cubique d'une transition CSS (`cubic-bezier(x1, y1, x2, y2)`).
//!
//! Même définition que la spécification CSS Easing : points de contrôle (0, 0), (x1, y1),
//! (x2, y2), (1, 1), abscisses dans [0, 1]. L'inversion de `x(t)` suit la méthode de Newton,
//! avec une bissection de repli quand la pente s'annule.
use crate::error::SceneError;

/// Coefficient de Bernstein d'un point de contrôle d'une courbe cubique.
const BERNSTEIN: f32 = 3.0;
const NEWTON_STEPS: usize = 8;
const BISECTION_STEPS: usize = 32;
const SOLVE_TOLERANCE: f32 = 1e-6;
const FLAT_SLOPE: f32 = 1e-6;

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CubicBezier {
    x1: f32,
    y1: f32,
    x2: f32,
    y2: f32,
}

impl CubicBezier {
    /// Progression linéaire : la valeur de repli quand une courbe n'est pas reconnue.
    pub const LINEAR: Self = Self {
        x1: 0.0,
        y1: 0.0,
        x2: 1.0,
        y2: 1.0,
    };

    /// # Errors
    /// `ThemeValue` si une valeur est non finie ou si une abscisse sort de [0, 1].
    pub fn new(x1: f32, y1: f32, x2: f32, y2: f32) -> Result<Self, SceneError> {
        let finite = [x1, y1, x2, y2].iter().all(|value| value.is_finite());
        if finite && (0.0..=1.0).contains(&x1) && (0.0..=1.0).contains(&x2) {
            Ok(Self { x1, y1, x2, y2 })
        } else {
            Err(SceneError::ThemeValue)
        }
    }

    /// Progression en [0, 1] pour un avancement `x` (borné à [0, 1]).
    #[must_use]
    pub fn ease(self, x: f32) -> f32 {
        let x = x.clamp(0.0, 1.0);
        let t = self.solve(x);
        sample(self.y1, self.y2, t)
    }

    fn solve(self, x: f32) -> f32 {
        let mut t = x;
        for _ in 0..NEWTON_STEPS {
            let error = sample(self.x1, self.x2, t) - x;
            if error.abs() < SOLVE_TOLERANCE {
                return t;
            }
            let slope = slope(self.x1, self.x2, t);
            if slope.abs() < FLAT_SLOPE {
                break;
            }
            t -= error / slope;
        }
        self.bisect(x)
    }

    fn bisect(self, x: f32) -> f32 {
        let (mut low, mut high) = (0.0_f32, 1.0_f32);
        let mut t = x;
        for _ in 0..BISECTION_STEPS {
            let value = sample(self.x1, self.x2, t);
            if (value - x).abs() < SOLVE_TOLERANCE {
                break;
            }
            if value < x {
                low = t;
            } else {
                high = t;
            }
            t = f32::midpoint(low, high);
        }
        t
    }
}

/// Coordonnée de la courbe pour des points de contrôle `a` et `b` (forme de Horner).
fn sample(a: f32, b: f32, t: f32) -> f32 {
    let c1 = BERNSTEIN * a;
    let c2 = BERNSTEIN * (b - a) - c1;
    let c3 = 1.0 - c1 - c2;
    ((c3 * t + c2) * t + c1) * t
}

fn slope(a: f32, b: f32, t: f32) -> f32 {
    let c1 = BERNSTEIN * a;
    let c2 = BERNSTEIN * (b - a) - c1;
    let c3 = 1.0 - c1 - c2;
    (BERNSTEIN * c3 * t + 2.0 * c2) * t + c1
}
