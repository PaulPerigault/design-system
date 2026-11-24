//! Ressources GPU : programmes, tampons envoyés une fois en octets.
use crate::fault::{Fault, GlFault};
use pp_milestones::plan::{AMBIENT, FOG_END, FOG_START, LIGHT};
use web_sys::{
    WebGl2RenderingContext as Gl, WebGlBuffer, WebGlProgram, WebGlUniformLocation,
    WebGlVertexArrayObject,
};

/// Octets par flottant.
pub const WORD: i32 = 4;

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
    pub vao: WebGlVertexArrayObject,
    pub buffers: [WebGlBuffer; 2],
}

pub fn count(value: usize) -> Result<i32, Fault> {
    i32::try_from(value).map_err(|_| GlFault::Resource.into())
}

pub fn upload_buffer(gl: &Gl, target: u32, bytes: &[u8]) -> Result<WebGlBuffer, Fault> {
    let buffer = gl.create_buffer().ok_or(GlFault::Resource)?;
    gl.bind_buffer(target, Some(&buffer));
    gl.buffer_data_with_u8_array(target, bytes, Gl::STATIC_DRAW);
    Ok(buffer)
}

/// Emplacements des uniformes d'un programme lié.
pub fn locate(gl: &Gl, program: WebGlProgram) -> Uniforms {
    let at = |name: &str| gl.get_uniform_location(&program, name);
    Uniforms {
        view_projection: at("u_view_projection"),
        model: at("u_model"),
        color: at("u_color"),
        lit: at("u_lit"),
        fade: at("u_fade"),
        program,
    }
}

/// Uniformes constants du programme des surfaces : lumière, ambiante, bornes du fondu.
pub fn constants(gl: &Gl, program: &WebGlProgram) {
    gl.use_program(Some(program));
    let at = |name: &str| gl.get_uniform_location(program, name);
    gl.uniform3f(at("u_light").as_ref(), LIGHT.x, LIGHT.y, LIGHT.z);
    gl.uniform1f(at("u_ambient").as_ref(), AMBIENT);
    gl.uniform2f(at("u_fog_range").as_ref(), FOG_START, FOG_END);
}

impl Gpu {
    /// Libère programmes, VAO, tampons (le contexte vivant les possède).
    pub fn free(&self, gl: &Gl) {
        gl.delete_program(Some(&self.solid.program));
        gl.delete_vertex_array(Some(&self.vao));
        for buffer in &self.buffers {
            gl.delete_buffer(Some(buffer));
        }
    }
}
