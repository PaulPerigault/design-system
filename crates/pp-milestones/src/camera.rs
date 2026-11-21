//! Caméra en perspective pilotée par l'abscisse `s` : vue d'ensemble entre les jalons, gros plan
//! sur chaque jalon (ADR-0013, décision 2).
use crate::animation::lerp;
use crate::camera_fit::close_camera;
use crate::layout::{MEDAL_RADIUS, elevated_back, path_point};
use crate::progress::nearest_to;
use glam::camera::rh::proj::opengl::perspective;
use glam::camera::rh::view::look_at_mat4;
use glam::{Mat4, Vec2, Vec3};

/// Vue d'ensemble : distance de l'œil à l'ancre sur le chemin, angle d'élévation (radians) et
/// avance du regard (en abscisses).
pub const DISTANCE_FAR: f32 = 6.5;
pub const ANGLE_FAR: f32 = 0.5;
pub const LOOK_AHEAD: f32 = 1.4;
/// Part de la plus petite demi-étendue de l'écran que le rayon de la médaille occupe en gros plan :
/// l'anneau de survol (1,16 rayon) tient alors encore dans le cadre.
pub const CLOSE_FILL: f32 = 0.38;
/// Cadre peu large (mobile) : la médaille occupe davantage, au moins ~45 % de la largeur.
pub const CLOSE_FILL_NARROW: f32 = 0.4;
pub const CLOSE_FILL_MOBILE: f32 = 0.6;
const WIDE_SPAN: f32 = 0.5;
pub const NARROW_ASPECT: f32 = 1.3;
/// Recul maximal du gros plan : le jalon précédent reste derrière l'œil (espacement de 5).
pub const MAX_CLOSE_DISTANCE: f32 = 4.9;
/// Écart (en abscisses) sous lequel le gros plan est plein, puis où il retombe à la vue d'ensemble.
pub const FOCUS_HOLD: f32 = 0.08;
pub const FOCUS_SPAN: f32 = 0.35;
/// Champ vertical de base (60°) et champ horizontal minimal (50°) pour les écrans étroits.
pub const FOV_Y: f32 = core::f32::consts::FRAC_PI_3;
pub const MIN_FOV_X: f32 = 0.87;
pub const NEAR: f32 = 0.1;
pub const FAR: f32 = 120.0;
const HALF: f32 = 0.5;
/// Polynôme de Hermite `3t² - 2t³`.
const HERMITE: [f32; 2] = [3.0, 2.0];

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Camera {
    pub eye: Vec3,
    pub target: Vec3,
}

fn safe_aspect(aspect: f32) -> f32 {
    if aspect.is_finite() && aspect > 0.0 {
        aspect
    } else {
        1.0
    }
}

/// Champ vertical : élargi quand le canvas est plus haut que large, pour garder une médaille entière.
#[must_use]
pub fn vertical_fov(aspect: f32) -> f32 {
    let narrow = 2.0 * ((MIN_FOV_X * HALF).tan() / safe_aspect(aspect)).atan();
    FOV_Y.max(narrow)
}

fn smoothstep(from: f32, to: f32, x: f32) -> f32 {
    let t = ((x - from) / (to - from)).clamp(0.0, 1.0);
    t * t * (HERMITE[0] - HERMITE[1] * t)
}

/// Poids du gros plan à l'abscisse `s` : 1 sur un jalon (palier de `FOCUS_HOLD`), 0 à mi-chemin.
#[must_use]
pub fn focus(s: f32) -> f32 {
    1.0 - smoothstep(FOCUS_HOLD, FOCUS_SPAN, (s - s.round()).abs())
}

/// Part de remplissage selon le cadre : `CLOSE_FILL_NARROW` en portrait et presque carré (bureau,
/// scène à côté du panneau), jusqu'à `CLOSE_FILL_MOBILE` à `NARROW_ASPECT` (mobile, scène basse et
/// large), puis retour à `CLOSE_FILL` en paysage large.
fn close_fill(aspect: f32) -> f32 {
    if aspect <= 1.0 {
        return CLOSE_FILL_NARROW;
    }
    if aspect <= NARROW_ASPECT {
        return lerp(
            CLOSE_FILL_NARROW,
            CLOSE_FILL_MOBILE,
            (aspect - 1.0) / (NARROW_ASPECT - 1.0),
        );
    }
    lerp(
        CLOSE_FILL_MOBILE,
        CLOSE_FILL,
        ((aspect - NARROW_ASPECT) / WIDE_SPAN).clamp(0.0, 1.0),
    )
}

/// Distance de l'œil pour que le rayon d'une médaille occupe `CLOSE_FILL` de la plus petite
/// demi-étendue du cadre (hauteur en paysage, largeur en portrait).
#[must_use]
pub fn close_distance(aspect: f32) -> f32 {
    let aspect = safe_aspect(aspect);
    let fill = close_fill(aspect);
    let half_extent = (vertical_fov(aspect) * HALF).tan() * aspect.min(1.0);
    (MEDAL_RADIUS / (fill * half_extent)).min(MAX_CLOSE_DISTANCE)
}

/// Caméra à l'abscisse `s` pour un parcours de `stops` étapes : sur la spline avec recul et hauteur
/// entre les jalons (vue d'ensemble), cadrage du gros plan (`camera_fit`) à proximité d'une étape.
#[must_use]
pub fn camera_at(s: f32, aspect: f32, stops: usize) -> Camera {
    let f = focus(s);
    let angle = ANGLE_FAR;
    let far = Camera {
        eye: path_point(s) + elevated_back(s, angle) * DISTANCE_FAR,
        target: path_point(s + LOOK_AHEAD),
    };
    if f <= 0.0 {
        return far;
    }
    let close = close_camera(nearest_to(s, stops), stops, aspect);
    Camera {
        eye: far.eye.lerp(close.eye, f),
        target: far.target.lerp(close.target, f),
    }
}

impl Camera {
    /// Matrice vue-projection pour le rapport largeur/hauteur `aspect`.
    #[must_use]
    pub fn view_projection(&self, aspect: f32) -> Mat4 {
        let aspect = safe_aspect(aspect);
        let view = look_at_mat4(self.eye, self.target, Vec3::Y);
        perspective(vertical_fov(aspect), aspect, NEAR, FAR) * view
    }

    /// Droite de l'écran, dans le monde (norme 1).
    #[must_use]
    pub fn right(&self) -> Vec3 {
        (self.target - self.eye).cross(Vec3::Y).normalize_or_zero()
    }
}

/// Coordonnées normalisées ([-1, 1], y vers le haut) et profondeur de vue d'un point du monde ;
/// `None` s'il est derrière la caméra.
#[must_use]
pub fn project(world: Vec3, view_projection: Mat4) -> Option<(Vec2, f32)> {
    let clip = view_projection * world.extend(1.0);
    (clip.w > 0.0).then(|| (Vec2::new(clip.x / clip.w, clip.y / clip.w), clip.w))
}
