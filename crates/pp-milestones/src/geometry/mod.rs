//! Maillages statiques de la scène, générés une fois puis envoyés au GPU en octets.
//!
//! Tout est construit en Rust (aucun fichier de modèle) : support de médaille, face du badge,
//! fantôme filaire, anneau de survol, étoile de l'objectif, rail et repères. [`pack::Pack`] les
//! range dans un seul tampon de sommets et un seul tampon d'indices ; chaque partie est une plage.
pub mod bytes;
pub mod check;
pub mod medal;
pub mod mesh;
pub mod pack;
pub mod rail;
pub mod solids;
pub mod star;
