//! Inclinaison des médailles : cible du pointeur ou du gyroscope, rejointe par lissage exponentiel.
use glam::Vec2;

/// Inclinaison maximale d'une médaille (radians, environ 20°).
pub const MAX_TILT: f32 = 0.35;
/// Écart sous lequel l'inclinaison est considérée comme arrivée : plus aucune image à produire.
pub const SETTLE_EPSILON: f32 = 1e-3;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Tilt {
    pointer: Vec2,
    gyro: Option<Vec2>,
    current: Vec2,
}

impl Tilt {
    /// Position du pointeur normalisée ([-1, 1]) ; une valeur non finie est ignorée.
    pub fn pointer_move(&mut self, position: Vec2) {
        if position.is_finite() {
            self.pointer = position.clamp(Vec2::NEG_ONE, Vec2::ONE);
        }
    }

    pub fn pointer_leave(&mut self) {
        self.pointer = Vec2::ZERO;
    }

    /// Inclinaison de l'appareil (normalisée) ; `None` rend la main au pointeur.
    pub fn set_gyro(&mut self, tilt: Option<Vec2>) {
        self.gyro = tilt
            .filter(|value| value.is_finite())
            .map(|value| value.clamp(Vec2::NEG_ONE, Vec2::ONE));
    }

    fn target(&self) -> Vec2 {
        self.gyro.unwrap_or(self.pointer)
    }

    /// Avance de `dt` millisecondes avec une constante de temps `tau` (0 : immédiat).
    pub fn step(&mut self, dt: f32, tau: f32) {
        let share = if tau <= 0.0 {
            1.0
        } else {
            1.0 - (-dt.max(0.0) / tau).exp()
        };
        self.current += (self.target() - self.current) * share;
        if self.settled() {
            self.current = self.target();
        }
    }

    /// Vrai quand l'inclinaison a rejoint sa cible : aucune image n'est plus nécessaire.
    #[must_use]
    pub fn settled(&self) -> bool {
        (self.target() - self.current).abs().max_element() < SETTLE_EPSILON
    }

    /// Angles (radians) : x autour de l'axe vertical, y autour de l'axe horizontal.
    #[must_use]
    pub fn angles(&self) -> Vec2 {
        self.current * MAX_TILT
    }
}
