//! Agrégation, quantiles de type 7 et sous-échantillonnage LTTB, en Rust pur (ADR-0006, décision 4,
//! étape V4a, issue #98 ; ADR-0007, décision 1, port `Aggregator`).
//!
//! Aucune dépendance à `wasm-bindgen` : la liaison WebAssembly vivra dans un crate `-wasm`.
//! Référence de comportement : `packages/dataviz` (TypeScript) ; la parité est testée contre
//! `tests/vectors/parity.json`, produit par `tools/data/build.mjs`.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod aggregate;
mod calendar;
mod error;
mod lttb;
mod lttb_run;
mod numbers;
mod operation;
mod quantile;

pub use aggregate::{Aggregated, aggregate};
pub use calendar::GroupBy;
pub use error::DataError;
pub use lttb::lttb;
pub use numbers::MAX_POINTS;
pub use operation::Operation;
pub use quantile::{quantile, quantiles};
