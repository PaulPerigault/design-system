//! Ressources GPU : programmes, tampons envoyés une fois en octets, textures des badges.
use crate::fault::{Fault, GlFault};
use crate::shaders::{BADGE, SOLID, program};
use crate::texture::{anisotropy_limit, upload};
use pp_milestones::geometry::mesh::FLOATS_PER_VERTEX;
use pp_milestones::geometry::pack::Pack;
use pp_milestones::plan::{AMBIENT, FOG_END, FOG_START, LIGHT};
use web_sys::{
    ImageBitmap, WebGl2RenderingContext as Gl, WebGlBuffer, WebGlProgram, WebGlTexture,
    WebGlUniformLocation, WebGlVertexArrayObject,
};

/// Octets par flottant ; emplacements des attributs (`layout(location)` du sommet partagé).
pub const WORD: i32 = 4;
const VECTOR: i32 = 3;
const UV: i32 = 2;
const ATTRIBUTES: [(u32, i32); 3] = [(0, VECTOR), (1, VECTOR), (2, UV)];

pub type Location = Option<WebGlUniformLocation>;

/// Emplacements des uniformes d'un programme.
pub struct Uniforms {
    pub program: WebGlProgram,
    pub view_projection: Location,
    pub model: Location,
    pub color: Location,
    pub lit: Location,
    pub fade: Location,
}

pub struct Gpu {
    pub solid: Uniforms,
    pub badge: Uniforms,
    pub vao: WebGlVertexArrayObject,
    pub buffers: [WebGlBuffer; 2],
    /// Une texture par jalon, quand son badge est arrivé.
    pub textures: Vec<Option<WebGlTexture>>,
    pub anisotropy: Option<f32>,
}

pub fn count(value: usize) -> Result<i32, Fault> {
    i32::try_from(value).map_err(|_| GlFault::Resource.into())
}

fn upload_buffer(gl: &Gl, target: u32, bytes: &[u8]) -> Result<WebGlBuffer, Fault> {
    let buffer = gl.create_buffer().ok_or(GlFault::Resource)?;
    gl.bind_buffer(target, Some(&buffer));
    gl.buffer_data_with_u8_array(target, bytes, Gl::STATIC_DRAW);
    Ok(buffer)
}

fn uniforms(gl: &Gl, fragment: &str) -> Result<Uniforms, Fault> {
    let program = program(gl, fragment)?;
    let at = |name: &str| gl.get_uniform_location(&program, name);
    Ok(Uniforms {
        view_projection: at("u_view_projection"),
        model: at("u_model"),
        color: at("u_color"),
        lit: at("u_lit"),
        fade: at("u_fade"),
        program,
    })
}

/// Uniformes constants du programme des surfaces : lumière, ambiante, bornes du fondu.
fn constants(gl: &Gl, program: &WebGlProgram) {
    gl.use_program(Some(program));
    let at = |name: &str| gl.get_uniform_location(program, name);
    gl.uniform3f(at("u_light").as_ref(), LIGHT.x, LIGHT.y, LIGHT.z);
    gl.uniform1f(at("u_ambient").as_ref(), AMBIENT);
    gl.uniform2f(at("u_fog_range").as_ref(), FOG_START, FOG_END);
}

impl Gpu {
    /// Programmes, tampons, puis les textures des badges déjà reçus (`bitmaps`, un par jalon).
    pub fn new(gl: &Gl, pack: &Pack, bitmaps: &[Option<ImageBitmap>]) -> Result<Self, Fault> {
        let (solid, badge) = (uniforms(gl, SOLID)?, uniforms(gl, BADGE)?);
        let vao = gl.create_vertex_array().ok_or(GlFault::Resource)?;
        gl.bind_vertex_array(Some(&vao));
        let vertices = upload_buffer(gl, Gl::ARRAY_BUFFER, &pack.vertex_bytes())?;
        let stride = count(FLOATS_PER_VERTEX)? * WORD;
        let mut offset = 0;
        for (location, size) in ATTRIBUTES {
            gl.enable_vertex_attrib_array(location);
            gl.vertex_attrib_pointer_with_i32(location, size, Gl::FLOAT, false, stride, offset);
            offset += size * WORD;
        }
        let indices = upload_buffer(gl, Gl::ELEMENT_ARRAY_BUFFER, &pack.index_bytes())?;
        constants(gl, &solid.program);
        gl.use_program(Some(&badge.program));
        gl.uniform1i(
            gl.get_uniform_location(&badge.program, "u_badge").as_ref(),
            0,
        );
        let anisotropy = anisotropy_limit(gl);
        let textures = bitmaps
            .iter()
            .map(|bitmap| bitmap.as_ref().and_then(|b| upload(gl, b, anisotropy).ok()))
            .collect();
        Ok(Self {
            solid,
            badge,
            vao,
            buffers: [vertices, indices],
            textures,
            anisotropy,
        })
    }

    /// Libère programmes, VAO, tampons et textures (le contexte vivant les possède).
    pub fn free(&self, gl: &Gl) {
        gl.delete_program(Some(&self.solid.program));
        gl.delete_program(Some(&self.badge.program));
        gl.delete_vertex_array(Some(&self.vao));
        for buffer in &self.buffers {
            gl.delete_buffer(Some(buffer));
        }
        for texture in self.textures.iter().flatten() {
            gl.delete_texture(Some(texture));
        }
    }
}
