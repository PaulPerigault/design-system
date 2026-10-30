//! Couleur OKLCH, sRGB et gamut sRGB, en Rust pur (ADR-0006, décision 4, étape 7a, issue #88).
//!
//! Aucune dépendance à `wasm-bindgen` : la liaison WebAssembly vivra dans un crate `-wasm`.
//! Référence de comportement : `packages/tokens` (TypeScript) ; la parité formelle (étape 7b, issue #89)
//! est testée contre `tests/vectors/parity.json`, produit par `tools/color/build.mjs`.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod apca;
mod contrast;
mod convert;
mod error;
mod gamut;
mod hex;
mod matrices;
mod transfer;
mod types;

pub use apca::apca_lc;
pub use contrast::{contrast_ratio, relative_luminance, rendered_srgb};
pub use convert::{oklch_to_linear_srgb, oklch_to_srgb, srgb_to_oklch};
pub use error::{ColorError, Component};
pub use gamut::{fit_to_gamut, in_srgb_gamut, in_srgb_gamut_within};
pub use hex::{hex_to_oklch, parse_hex, to_hex};
pub use transfer::{gamma_to_linear, linear_to_gamma};
pub use types::{LinearSrgb, Oklch, Srgb};
