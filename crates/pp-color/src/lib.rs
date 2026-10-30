//! Couleur OKLCH, sRGB et gamut sRGB, en Rust pur (ADR-0006, décision 4, étape 7a, issue #88).
//!
//! Aucune dépendance à `wasm-bindgen` : la liaison WebAssembly vivra dans un crate `-wasm`.
//! Référence de comportement : `packages/tokens` (TypeScript) ; la parité formelle est l'étape 7b.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod convert;
mod error;
mod gamut;
mod matrices;
mod transfer;
mod types;

pub use convert::{oklch_to_linear_srgb, oklch_to_srgb, srgb_to_oklch};
pub use error::{ColorError, Component};
pub use gamut::{fit_to_gamut, in_srgb_gamut, in_srgb_gamut_within};
pub use transfer::{gamma_to_linear, linear_to_gamma};
pub use types::{LinearSrgb, Oklch, Srgb};
