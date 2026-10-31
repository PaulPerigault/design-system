//! Liaison WebAssembly de `pp-data` (ADR-0006, décision 4, étape V4b, issue #99).
//!
//! Crate mince : conversion des types JavaScript (tableaux typés, masque des valeurs manquantes)
//! vers ceux de `pp-data`, aucune logique de calcul. Une erreur devient une chaîne littérale (voir
//! [`fault`]), jamais un panic ; l'enveloppe TypeScript (`packages/data`) la rend en erreur typée.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod aggregate;
mod fault;
mod input;
mod lttb;
mod quantile;
