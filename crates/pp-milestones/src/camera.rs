//! Caméra en perspective qui glisse le long du chemin.
use crate::layout::{path_point, path_tangent};
use glam::camera::rh::proj::opengl::perspective;
use glam::camera::rh::view::look_at_mat4;
use glam::{Mat4, Vec2, Vec3};

/// Recul de la caméra derrière le point regardé, en unités du monde.
pub const BACK_DISTANCE: f32 = 3.2;
/// Hauteur de l'œil : assez haute pour voir le jalon actif par-dessus le précédent, qui reste
/// derrière la caméra tant que `BACK_DISTANCE` est inférieur à l'espacement.
pub const ELEVATION: f32 = 2.2;
pub const LOOK_LIFT: f32 = 0.0;
/// Champ vertical de base (60°) et champ horizontal minimal (50°) pour les écrans étroits.
pub const FOV_Y: f32 = core::f32::consts::FRAC_PI_3;
pub const MIN_FOV_X: f32 = 0.87;
pub const NEAR: f32 = 0.1;
pub const FAR: f32 = 120.0;
const HALF: f32 = 0.5;

/// Champ vertical : élargi quand le canvas est plus haut que large, pour garder une médaille entière.
#[must_use]
pub fn vertical_fov(aspect: f32) -> f32 {
    if !aspect.is_finite() || aspect <= 0.0 {
        return FOV_Y;
    }
    let narrow = 2.0 * ((MIN_FOV_X * HALF).tan() / aspect).atan();
    FOV_Y.max(narrow)
}

/// Inclinaison de la vue (radians) : les médailles se penchent de cet angle pour faire face à l'œil.
#[must_use]
pub fn pitch() -> f32 {
    ELEVATION.atan2(BACK_DISTANCE)
}

/// Position de l'œil quand la caméra regarde l'abscisse `s`.
#[must_use]
pub fn eye(s: f32) -> Vec3 {
    path_point(s) - path_tangent(s) * BACK_DISTANCE + Vec3::Y * ELEVATION
}

/// Matrice vue-projection pour l'abscisse `s` et le rapport largeur/hauteur `aspect`.
#[must_use]
pub fn view_projection(s: f32, aspect: f32) -> Mat4 {
    let target = path_point(s) + Vec3::Y * LOOK_LIFT;
    let view = look_at_mat4(eye(s), target, Vec3::Y);
    let safe = if aspect.is_finite() && aspect > 0.0 {
        aspect
    } else {
        1.0
    };
    perspective(vertical_fov(safe), safe, NEAR, FAR) * view
}

/// Coordonnées normalisées ([-1, 1], y vers le haut) d'un point du monde ; `None` s'il est
/// derrière la caméra.
#[must_use]
pub fn project(world: Vec3, view_projection: Mat4) -> Option<Vec2> {
    let clip = view_projection * world.extend(1.0);
    (clip.w > 0.0).then(|| Vec2::new(clip.x / clip.w, clip.y / clip.w))
}
