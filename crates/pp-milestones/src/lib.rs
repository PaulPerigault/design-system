//! Scène de jalons en Rust pur (ADR-0012, chantier #360).
//!
//! Aucune dépendance à `wasm-bindgen` ni à `web-sys` : tout ce qui se calcule (contrat de données,
//! géométrie, caméra, animation, interaction, thème) se teste en natif. La couche WebGL2 vit dans
//! `pp-milestones-wasm`, qui n'appelle que la plateforme.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

pub mod animation;
pub mod camera;
pub mod columns;
pub mod controls;
pub mod data;
pub mod easing;
pub mod error;
pub mod geometry;
pub mod interaction;
pub mod kinds;
pub mod layout;
pub mod picking;
pub mod plan;
pub mod state;
pub mod theme;
pub mod tilt;

pub use columns::from_columns;
pub use data::{Milestone, MilestonesData};
pub use easing::CubicBezier;
pub use error::SceneError;
/// Vecteur 2D de `glam`, pour les crates de liaison (coordonnées normalisées).
pub use glam::Vec2;
pub use interaction::Key;
pub use kinds::{Emblem, Status};
pub use state::{Frame, SceneState};
pub use theme::{Slot, THEME_LEN, Theme};
