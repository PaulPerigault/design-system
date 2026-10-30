//! Liaison WebAssembly de `pp-color` (ADR-0006, décision 4, étape 8, issue #90).
//!
//! Crate mince : conversion des types JavaScript vers ceux de `pp-color`, aucune logique de couleur.
//! Une erreur de `pp-color` devient une chaîne `code:grandeur` (voir [`fault`]), jamais un panic ;
//! l'enveloppe TypeScript (`packages/color`) la rend en erreur typée.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod color;
mod contrast;
mod fault;
