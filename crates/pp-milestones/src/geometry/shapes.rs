//! Tables des formes des emblèmes, en coordonnées unitaires (x à droite, y en haut, [-1, 1]).
use glam::Vec2;

/// Forme élémentaire en relief.
#[derive(Debug, Clone, Copy)]
pub enum Shape {
    Disc {
        center: Vec2,
        radius: f32,
    },
    Bar {
        from: Vec2,
        to: Vec2,
        width: f32,
    },
    Poly(&'static [Vec2]),
    Ring {
        center: Vec2,
        inner: f32,
        outer: f32,
    },
}

const fn p(x: f32, y: f32) -> Vec2 {
    Vec2::new(x, y)
}

const fn bar(from: Vec2, to: Vec2, width: f32) -> Shape {
    Shape::Bar { from, to, width }
}

const fn disc(center: Vec2, radius: f32) -> Shape {
    Shape::Disc { center, radius }
}

pub const DISC: &[Shape] = &[disc(p(0.0, 0.0), 0.7)];

pub const CHECK: &[Shape] = &[
    bar(p(-0.55, -0.05), p(-0.15, -0.45), 0.28),
    bar(p(-0.15, -0.45), p(0.6, 0.4), 0.28),
];

const SHIELD_OUTLINE: &[Vec2] = &[
    p(-0.55, 0.6),
    p(-0.55, 0.0),
    p(0.0, -0.7),
    p(0.55, 0.0),
    p(0.55, 0.6),
];
pub const SHIELD: &[Shape] = &[Shape::Poly(SHIELD_OUTLINE)];

pub const CLOUD: &[Shape] = &[
    disc(p(-0.35, -0.1), 0.38),
    disc(p(0.0, 0.2), 0.5),
    disc(p(0.38, -0.1), 0.36),
    bar(p(-0.35, -0.3), p(0.38, -0.3), 0.36),
];

pub const NETWORK: &[Shape] = &[
    disc(p(0.0, 0.5), 0.2),
    disc(p(-0.5, -0.4), 0.2),
    disc(p(0.5, -0.4), 0.2),
    bar(p(0.0, 0.5), p(-0.5, -0.4), 0.1),
    bar(p(0.0, 0.5), p(0.5, -0.4), 0.1),
    bar(p(-0.5, -0.4), p(0.5, -0.4), 0.1),
];

pub const DATABASE: &[Shape] = &[
    bar(p(-0.55, 0.45), p(0.55, 0.45), 0.28),
    bar(p(-0.55, 0.0), p(0.55, 0.0), 0.28),
    bar(p(-0.55, -0.45), p(0.55, -0.45), 0.28),
];

pub const CODE: &[Shape] = &[
    bar(p(-0.15, 0.5), p(-0.6, 0.0), 0.2),
    bar(p(-0.6, 0.0), p(-0.15, -0.5), 0.2),
    bar(p(0.15, 0.5), p(0.6, 0.0), 0.2),
    bar(p(0.6, 0.0), p(0.15, -0.5), 0.2),
];

pub const KEY: &[Shape] = &[
    Shape::Ring {
        center: p(-0.35, 0.0),
        inner: 0.2,
        outer: 0.42,
    },
    bar(p(0.0, 0.0), p(0.65, 0.0), 0.18),
    bar(p(0.4, 0.0), p(0.4, -0.3), 0.14),
    bar(p(0.62, 0.0), p(0.62, -0.22), 0.14),
];

/// Cœur de l'engrenage ; les dents sont calculées (voir `emblem.rs`).
pub const GEAR_CORE: &[Shape] = &[disc(p(0.0, 0.0), 0.5)];
pub const GEAR_TEETH: usize = 8;
pub const GEAR_TOOTH_FROM: f32 = 0.45;
pub const GEAR_TOOTH_TO: f32 = 0.68;
pub const GEAR_TOOTH_WIDTH: f32 = 0.22;
