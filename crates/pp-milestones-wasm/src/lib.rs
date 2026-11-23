//! Liaison WebGL2 de `pp-milestones` (ADR-0012, ADR-0013, ADR-0006 décision 4).
//!
//! Couche d'entrée-sortie : elle appelle WebGL et convertit les types, elle ne décide rien. Tout
//! ce qui se calcule (données, géométrie, caméra, animation, interaction, thème) est dans
//! `pp-milestones` et se teste en natif. Une erreur devient un code littéral (voir [`fault`]),
//! jamais un panic ni un message formaté ; l'enveloppe TypeScript (`packages/milestones-3d`) la
//! rend en erreur typée.
#![forbid(unsafe_code)]
#![deny(
    clippy::unwrap_used,
    clippy::expect_used,
    clippy::panic,
    clippy::indexing_slicing
)]
#![cfg_attr(test, allow(clippy::unwrap_used, clippy::expect_used))]

mod bindings;
mod controls;
mod convert;
mod draw;
mod fault;
mod gl;
mod gpu;
mod input;
mod shaders;
mod stages;
mod texture;
mod warm;
