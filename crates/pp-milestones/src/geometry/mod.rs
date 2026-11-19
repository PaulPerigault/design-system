//! Maillages statiques de la scène, générés une fois puis envoyés au GPU en octets.
//!
//! Tout est construit en Rust (aucun fichier de modèle) : un corps de médaille, son fil de fer,
//! neuf emblèmes, un ruban et une cible. [`pack::Pack`] les range dans un seul tampon de sommets
//! et un seul tampon d'indices ; chaque partie est une plage d'indices.
pub mod emblem;
pub mod medal;
pub mod mesh;
pub mod pack;
pub mod ribbon;
pub mod shapes;
pub mod solids;
