//! Cadrage du gros plan (ADR-0013) : l'œil recule jusqu'à ce que la médaille active et les deux
//! étapes suivantes (ou moins, en fin de parcours) tiennent entièrement dans le cadre, marges
//! comprises, puis le regard est centré sur leur emprise. Pur : aucun état, testé sur tous les
//! formats et toutes les étapes. La médaille active reste la plus proche donc la plus grande.
use crate::camera::{Camera, close_distance, project, vertical_fov};
use crate::layout::{FACE_PITCH, MEDAL_RADIUS, elevated_back, ordinal, path_point};
use glam::{Vec2, Vec3};

/// Marge de chaque côté, en fraction de la largeur (et de la hauteur) du canevas.
pub const MARGIN: f32 = 0.06;
/// Place réservée sous la médaille active pour son étiquette (en coordonnées normalisées).
pub const LABEL_ROOM: f32 = 0.18;
/// Nombre d'étapes à venir cadrées avec l'active.
pub const AHEAD: usize = 2;
/// Encombrement d'une médaille : anneau de survol, médaille avancée et agrandie (× rayon).
pub const HALO: f32 = 1.3;
/// Plafond du recul (formats extrêmes) et nombre de tours de recherche et de centrage.
pub const MAX_DISTANCE: f32 = 30.0;
const SEARCH_STEPS: usize = 16;
const CENTER_STEPS: usize = 6;
const HALF: f32 = 0.5;
const NDC_SPAN: f32 = 2.0;

/// Centres des médailles cadrées : l'active, puis jusqu'à `AHEAD` étapes suivantes.
fn centers(index: usize, stops: usize) -> Vec<Vec3> {
    let last = stops.saturating_sub(1);
    (index..=(index + AHEAD).min(last.max(index)))
        .map(|stop| path_point(ordinal(stop)))
        .collect()
}

/// Disque projeté d'un centre : centre et demi-étendues normalisées (x, y).
fn disc(center: Vec3, camera: &Camera, matrix: glam::Mat4, aspect: f32) -> Option<(Vec2, Vec2)> {
    let (middle, _) = project(center, matrix)?;
    let (edge, _) = project(center + camera.right() * MEDAL_RADIUS * HALO, matrix)?;
    let half_x = (edge.x - middle.x).abs();
    Some((middle, Vec2::new(half_x, half_x * aspect)))
}

fn camera_at_distance(index: usize, stops: usize, aspect: f32, distance: f32) -> (Camera, bool) {
    let base = path_point(ordinal(index));
    let points = centers(index, stops);
    let eye = base + elevated_back(ordinal(index), FACE_PITCH) * distance;
    let mut target = points.iter().sum::<Vec3>() / ordinal(points.len());
    let half_fov = (vertical_fov(aspect) * HALF).tan();
    let extent = |camera: &Camera| -> Option<(Vec2, Vec2, f32)> {
        let matrix = camera.view_projection(aspect);
        let discs: Option<Vec<_>> = points
            .iter()
            .map(|p| disc(*p, camera, matrix, aspect))
            .collect();
        let discs = discs?;
        let min = discs.iter().fold(Vec2::MAX, |m, (c, r)| m.min(*c - *r));
        let max = discs.iter().fold(Vec2::MIN, |m, (c, r)| m.max(*c + *r));
        let (active, radius) = discs.first().copied()?;
        Some((min, max, active.y - radius.y))
    };
    for _ in 0..CENTER_STEPS {
        let camera = Camera { eye, target };
        let Some((min, max, _)) = extent(&camera) else {
            break;
        };
        let (centre, forward) = ((min + max) * HALF, (target - eye).normalize_or_zero());
        let up = camera.right().cross(forward);
        let height = (target - eye).length() * half_fov;
        target += camera.right() * centre.x * aspect * height + up * centre.y * height;
    }
    let camera = Camera { eye, target };
    let edge = NDC_SPAN * MARGIN;
    let fits = extent(&camera).is_some_and(|(min, max, active_bottom)| {
        min.x >= -1.0 + edge
            && max.x <= 1.0 - edge
            && min.y >= -1.0 + edge
            && max.y <= 1.0 - edge
            && active_bottom >= -1.0 + edge + LABEL_ROOM
    });
    (camera, fits)
}

/// Caméra de gros plan sur l'étape `index` d'un parcours de `stops` étapes, pour le format
/// `aspect` : la plus proche (la plus grande médaille active) dont tout le groupe tient dans le
/// cadre. Jamais plus proche que le remplissage de `close_distance`.
#[must_use]
pub fn close_camera(index: usize, stops: usize, aspect: f32) -> Camera {
    let (mut low, mut high) = (close_distance(aspect), MAX_DISTANCE);
    let (nearest, fits) = camera_at_distance(index, stops, aspect, low);
    if fits {
        return nearest;
    }
    for _ in 0..SEARCH_STEPS {
        let middle = (low + high) * HALF;
        if camera_at_distance(index, stops, aspect, middle).1 {
            high = middle;
        } else {
            low = middle;
        }
    }
    camera_at_distance(index, stops, aspect, high).0
}
