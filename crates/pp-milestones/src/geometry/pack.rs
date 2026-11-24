//! Toutes les parties dans un tampon de sommets et un tampon d'indices.
use super::bytes::{floats_to_bytes, indices_to_bytes};
use super::mesh::{FLOATS_PER_VERTEX, MAX_VERTICES, Mesh};
use super::{check, medal, rail, star};
use crate::error::SceneError;

/// Partie dessinable de la scène.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Part {
    Support,
    Wire,
    Ring,
    Check,
    Rail,
    Marker,
    Star,
    StarOutline,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Mode {
    Triangles,
    Lines,
}

/// Plage d'indices d'une partie : premier indice, nombre d'indices, primitive.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Range {
    pub first: usize,
    pub count: usize,
    pub mode: Mode,
}

#[derive(Debug, Clone, Default)]
pub struct Pack {
    vertices: Vec<f32>,
    indices: Vec<u32>,
    ranges: Vec<(Part, Range)>,
}

impl Pack {
    /// Construit toutes les parties pour `count` jalons et un objectif éventuel.
    ///
    /// # Errors
    /// `GeometrySize` si le maillage dépasse la capacité des indices.
    pub fn build(count: usize, goal: bool) -> Result<Self, SceneError> {
        let mut pack = Self::default();
        let solid = Mode::Triangles;
        pack.add(Part::Support, &medal::support(), solid);
        pack.add(Part::Wire, &medal::wire(), Mode::Lines);
        pack.add(Part::Ring, &medal::ring(), solid);
        pack.add(Part::Check, &check::check(), solid);
        pack.add(Part::Rail, &rail::rail(count, goal), solid);
        pack.add(Part::Marker, &rail::marker(), solid);
        pack.add(Part::Star, &star::solid(), solid);
        pack.add(Part::StarOutline, &star::outline(), Mode::Lines);
        if pack.vertices.len() / FLOATS_PER_VERTEX > MAX_VERTICES {
            return Err(SceneError::GeometrySize);
        }
        Ok(pack)
    }

    fn add(&mut self, part: Part, mesh: &Mesh, mode: Mode) {
        let base = u32::try_from(self.vertices.len() / FLOATS_PER_VERTEX).unwrap_or(u32::MAX);
        let source = match mode {
            Mode::Triangles => &mesh.triangles,
            Mode::Lines => &mesh.lines,
        };
        let range = Range {
            first: self.indices.len(),
            count: source.len(),
            mode,
        };
        self.vertices.extend(&mesh.vertices);
        self.indices
            .extend(source.iter().map(|index| index.saturating_add(base)));
        self.ranges.push((part, range));
    }

    #[must_use]
    pub fn range(&self, part: Part) -> Option<Range> {
        self.ranges
            .iter()
            .find(|(p, _)| *p == part)
            .map(|(_, range)| *range)
    }

    #[must_use]
    pub fn vertices(&self) -> &[f32] {
        &self.vertices
    }

    #[must_use]
    pub fn indices(&self) -> &[u32] {
        &self.indices
    }

    /// Sommets en octets petit-boutistes (`bufferData` sans `unsafe`).
    #[must_use]
    pub fn vertex_bytes(&self) -> Vec<u8> {
        floats_to_bytes(&self.vertices)
    }

    #[must_use]
    pub fn index_bytes(&self) -> Vec<u8> {
        indices_to_bytes(&self.indices)
    }
}
