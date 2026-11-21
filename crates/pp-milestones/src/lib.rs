//! Scène de jalons en Rust pur (ADR-0012 et ADR-0013, chantiers #360 et #389).
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
pub mod frame;
pub mod geometry;
pub mod interaction;
pub mod kinds;
pub mod layout;
pub mod medals;
pub mod picking;
pub mod plan;
pub mod progress;
pub mod project;
pub mod spline;
pub mod state;
pub mod theme;
pub mod tilt;

pub use columns::from_columns;
pub use data::{GOAL_ID, Milestone, MilestonesData};
pub use easing::CubicBezier;
pub use error::SceneError;
pub use frame::Frame;
/// Vecteur 2D de `glam`, pour les crates de liaison (coordonnées normalisées).
pub use glam::Vec2;
pub use kinds::Status;
pub use project::Projected;
pub use state::SceneState;
pub use theme::{Slot, THEME_LEN, Theme};
