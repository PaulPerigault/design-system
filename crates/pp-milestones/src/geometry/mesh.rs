//! Constructeur de maillage : sommets entrelacés (position, normale, UV) et indices `u32`.
use crate::error::SceneError;
use glam::{Vec2, Vec3};

/// Capacité maximale en sommets : très au-dessus du besoin, sous la limite des indices.
pub const MAX_VERTICES: usize = 1 << 20;
/// Flottants par sommet : position (3), normale (3), UV (2).
pub const FLOATS_PER_VERTEX: usize = 8;

#[derive(Debug, Clone, Copy, PartialEq, Default)]
pub struct Vertex {
    pub position: Vec3,
    pub normal: Vec3,
    pub uv: Vec2,
}

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

    #[must_use]
    pub fn vertex(&self, index: usize) -> Option<Vertex> {
        let start = index.checked_mul(FLOATS_PER_VERTEX)?;
        let &[px, py, pz, nx, ny, nz, u, v] =
            self.vertices.get(start..start + FLOATS_PER_VERTEX)?
        else {
            return None;
        };
        Some(Vertex {
            position: Vec3::new(px, py, pz),
            normal: Vec3::new(nx, ny, nz),
            uv: Vec2::new(u, v),
        })
    }

    /// Indice du prochain sommet ; saturé en cas de débordement, que `check` signale.
    #[must_use]
    pub fn vertex_base(&self) -> u32 {
        u32::try_from(self.vertex_count()).unwrap_or(u32::MAX)
    }

    pub fn add(&mut self, vertex: Vertex) -> u32 {
        let index = self.vertex_base();
        let Vertex {
            position: p,
            normal: n,
            uv,
        } = vertex;
        self.vertices
            .extend([p.x, p.y, p.z, n.x, n.y, n.z, uv.x, uv.y]);
        index
    }

    /// Sommet sans UV.
    pub fn vertex_at(&mut self, position: Vec3, normal: Vec3) -> u32 {
        self.add(Vertex {
            position,
            normal,
            uv: Vec2::ZERO,
        })
    }

    /// Triangle (sens trigonométrique vu de la normale), normale plate.
    pub fn triangle(&mut self, a: Vec3, b: Vec3, c: Vec3) {
        let normal = (b - a).cross(c - a).normalize_or_zero();
        let ids = [a, b, c].map(|p| self.vertex_at(p, normal));
        self.triangles.extend(ids);
    }

    /// Quadrilatère plan `a b c d` (sens trigonométrique), normale plate, quatre sommets, UV donnés.
    pub fn quad_uv(&mut self, corners: [Vec3; 4], uvs: [Vec2; 4]) {
        let [a, b, c, _] = corners;
        let normal = (b - a).cross(c - a).normalize_or_zero();
        let [ia, ib, ic, id] = [0, 1, 2, 3].map(|k| {
            let position = corners.get(k).copied().unwrap_or_default();
            let uv = uvs.get(k).copied().unwrap_or_default();
            self.add(Vertex {
                position,
                normal,
                uv,
            })
        });
        self.triangles.extend([ia, ib, ic, ia, ic, id]);
    }

    pub fn quad(&mut self, a: Vec3, b: Vec3, c: Vec3, d: Vec3) {
        self.quad_uv([a, b, c, d], [Vec2::ZERO; 4]);
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
