//! Transition d'une grandeur scalaire : temps injecté, courbe et durée fournies par le thème.
use crate::easing::CubicBezier;

/// Interpolation linéaire de `from` vers `to`.
#[must_use]
pub fn lerp(from: f32, to: f32, t: f32) -> f32 {
    from + (to - from) * t
}

/// Valeur qui glisse de `from` vers `to` entre `start` et `start + duration` (millisecondes).
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Tween {
    from: f32,
    to: f32,
    start: f32,
    duration: f32,
    curve: CubicBezier,
}

impl Tween {
    /// Valeur au repos.
    #[must_use]
    pub const fn at(value: f32) -> Self {
        Self {
            from: value,
            to: value,
            start: 0.0,
            duration: 0.0,
            curve: CubicBezier::LINEAR,
        }
    }

    /// Repart de la valeur courante vers `to`. Durée nulle : saut immédiat.
    pub fn retarget(&mut self, now: f32, to: f32, duration: f32, curve: CubicBezier) {
        *self = Self {
            from: self.value(now),
            to,
            start: now,
            duration: duration.max(0.0),
            curve,
        };
    }

    #[must_use]
    pub fn value(&self, now: f32) -> f32 {
        if self.duration <= 0.0 {
            return self.to;
        }
        let progress = ((now - self.start) / self.duration).clamp(0.0, 1.0);
        lerp(self.from, self.to, self.curve.ease(progress))
    }

    #[must_use]
    pub fn is_running(&self, now: f32) -> bool {
        self.duration > 0.0 && now < self.start + self.duration
    }

    #[must_use]
    pub const fn target(&self) -> f32 {
        self.to
    }
}
