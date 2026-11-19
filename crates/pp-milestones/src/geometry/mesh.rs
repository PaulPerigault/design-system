//! Constructeur de maillage : sommets entrelacés (position, normale) et indices `u32`.
use crate::error::SceneError;
use glam::{Mat4, Vec3};

/// Capacité maximale en sommets : très au-dessus du besoin, sous la limite des indices.
pub const MAX_VERTICES: usize = 1 << 20;
/// Flottants par sommet : position (3) puis normale (3).
pub const FLOATS_PER_VERTEX: usize = 6;

#[derive(Debug, Clone, Default, PartialEq)]
pub struct Mesh {
    pub vertices: Vec<f32>,
    pub triangles: Vec<u32>,
    pub lines: Vec<u32>,
}

impl Mesh {
    #[must_use]
    pub fn vertex_count(&self) -> usize {
        self.vertices.len() / FLOATS_PER_VERTEX
    }

    /// Sommet `index` : (position, normale).
    #[must_use]
    pub fn vertex(&self, index: usize) -> Option<(Vec3, Vec3)> {
        let start = index.checked_mul(FLOATS_PER_VERTEX)?;
        let &[px, py, pz, nx, ny, nz] = self.vertices.get(start..start + FLOATS_PER_VERTEX)? else {
            return None;
        };
        Some((Vec3::new(px, py, pz), Vec3::new(nx, ny, nz)))
    }

    /// Ajoute `other`, transformé par `transform` (les normales par la partie linéaire).
    pub fn append(&mut self, other: &Self, transform: Mat4) {
        let base = self.vertex_base();
        let normal_matrix = glam::Mat3::from_mat4(transform).inverse().transpose();
        for index in 0..other.vertex_count() {
            if let Some((position, normal)) = other.vertex(index) {
                let p = transform.transform_point3(position);
                let n = (normal_matrix * normal).normalize_or_zero();
                self.vertices.extend([p.x, p.y, p.z, n.x, n.y, n.z]);
            }
        }
        self.triangles
            .extend(other.triangles.iter().map(|i| i + base));
        self.lines.extend(other.lines.iter().map(|i| i + base));
    }

    /// Indice du prochain sommet ; saturé en cas de débordement, que `check` signale.
    #[must_use]
    pub fn vertex_base(&self) -> u32 {
        u32::try_from(self.vertex_count()).unwrap_or(u32::MAX)
    }

    pub fn vertex_at(&mut self, position: Vec3, normal: Vec3) -> u32 {
        let index = self.vertex_base();
        self.vertices.extend([
            position.x, position.y, position.z, normal.x, normal.y, normal.z,
        ]);
        index
    }

    /// Triangle (sens trigonométrique vu de la normale), normale plate.
    pub fn triangle(&mut self, a: Vec3, b: Vec3, c: Vec3) {
        let normal = (b - a).cross(c - a).normalize_or_zero();
        let (ia, ib, ic) = (
            self.vertex_at(a, normal),
            self.vertex_at(b, normal),
            self.vertex_at(c, normal),
        );
        self.triangles.extend([ia, ib, ic]);
    }

    /// Quadrilatère plan `a b c d` (sens trigonométrique), normale plate.
    pub fn quad(&mut self, a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
        self.triangle(a, b, c);
        self.triangle(a, c, d);
    }

    /// Segment de fil de fer (normale nulle : jamais éclairé).
    pub fn line(&mut self, a: Vec3, b: Vec3) {
        let (ia, ib) = (self.vertex_at(a, Vec3::ZERO), self.vertex_at(b, Vec3::ZERO));
        self.lines.extend([ia, ib]);
    }

    /// # Errors
    /// `GeometrySize` si le maillage dépasse `MAX_VERTICES`.
    pub fn check(self) -> Result<Self, SceneError> {
        if self.vertex_count() > MAX_VERTICES {
            return Err(SceneError::GeometrySize);
        }
        Ok(self)
    }
}

/// Octets petit-boutiste, prêts pour `bufferData` sans `unsafe`.
#[must_use]
pub fn floats_to_bytes(values: &[f32]) -> Vec<u8> {
    values
        .iter()
        .flat_map(|value| value.to_le_bytes())
        .collect()
}

#[must_use]
pub fn indices_to_bytes(values: &[u32]) -> Vec<u8> {
    values
        .iter()
        .flat_map(|value| value.to_le_bytes())
        .collect()
}
