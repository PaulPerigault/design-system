//! Ressources GPU et appels de dessin : tampons envoyés une fois en octets, uniformes par élément.
use crate::fault::{Fault, GlFault};
use crate::shaders::program;
use pp_milestones::geometry::mesh::FLOATS_PER_VERTEX;
use pp_milestones::geometry::pack::{Mode, Pack};
use pp_milestones::plan::{AMBIENT, DrawItem, FOG_END, FOG_START, LIGHT};
use pp_milestones::{Frame, Slot, Theme};
use web_sys::{
    WebGl2RenderingContext as Gl, WebGlBuffer, WebGlProgram, WebGlUniformLocation,
    WebGlVertexArrayObject,
};

/// Octets par flottant et par indice (`u32`).
const WORD: i32 = 4;
const POSITION: u32 = 0;
const NORMAL: u32 = 1;
const VECTOR: i32 = 3;

type Location = Option<WebGlUniformLocation>;

struct Uniforms {
    view_projection: Location,
    model: Location,
    color: Location,
    lit: Location,
}

pub struct Gpu {
    program: WebGlProgram,
    vao: WebGlVertexArrayObject,
    buffers: [WebGlBuffer; 2],
    uniforms: Uniforms,
}

fn count(value: usize) -> Result<i32, Fault> {
    i32::try_from(value).map_err(|_| GlFault::Resource.into())
}

fn upload(gl: &Gl, target: u32, bytes: &[u8]) -> Result<WebGlBuffer, Fault> {
    let buffer = gl.create_buffer().ok_or(GlFault::Resource)?;
    gl.bind_buffer(target, Some(&buffer));
    gl.buffer_data_with_u8_array(target, bytes, Gl::STATIC_DRAW);
    Ok(buffer)
}

impl Gpu {
    pub fn new(gl: &Gl, pack: &Pack) -> Result<Self, Fault> {
        let program = program(gl)?;
        let vao = gl.create_vertex_array().ok_or(GlFault::Resource)?;
        gl.bind_vertex_array(Some(&vao));
        let vertices = upload(gl, Gl::ARRAY_BUFFER, &pack.vertex_bytes())?;
        let stride = count(FLOATS_PER_VERTEX)? * WORD;
        gl.enable_vertex_attrib_array(POSITION);
        gl.vertex_attrib_pointer_with_i32(POSITION, VECTOR, Gl::FLOAT, false, stride, 0);
        gl.enable_vertex_attrib_array(NORMAL);
        gl.vertex_attrib_pointer_with_i32(NORMAL, VECTOR, Gl::FLOAT, false, stride, VECTOR * WORD);
        let indices = upload(gl, Gl::ELEMENT_ARRAY_BUFFER, &pack.index_bytes())?;
        let at = |name: &str| gl.get_uniform_location(&program, name);
        let uniforms = Uniforms {
            view_projection: at("u_view_projection"),
            model: at("u_model"),
            color: at("u_color"),
            lit: at("u_lit"),
        };
        gl.use_program(Some(&program));
        constants(gl, &program);
        Ok(Self {
            program,
            vao,
            buffers: [vertices, indices],
            uniforms,
        })
    }

    pub fn draw(&self, gl: &Gl, frame: &Frame, theme: &Theme) -> Result<(), Fault> {
        gl.use_program(Some(&self.program));
        gl.bind_vertex_array(Some(&self.vao));
        let fog = theme.color(Slot::Bg);
        let at = |name: &str| gl.get_uniform_location(&self.program, name);
        gl.uniform3f(at("u_fog_color").as_ref(), fog[0], fog[1], fog[2]);
        let matrix = frame.view_projection.to_cols_array();
        gl.uniform_matrix4fv_with_f32_array(self.uniforms.view_projection.as_ref(), false, &matrix);
        for item in &frame.items {
            self.item(gl, item)?;
        }
        Ok(())
    }

    fn item(&self, gl: &Gl, item: &DrawItem) -> Result<(), Fault> {
        let model = item.model.to_cols_array();
        gl.uniform_matrix4fv_with_f32_array(self.uniforms.model.as_ref(), false, &model);
        let [r, g, b] = item.color;
        gl.uniform3f(self.uniforms.color.as_ref(), r, g, b);
        gl.uniform1f(self.uniforms.lit.as_ref(), f32::from(u8::from(item.lit)));
        let mode = match item.range.mode {
            Mode::Triangles => Gl::TRIANGLES,
            Mode::Lines => Gl::LINES,
        };
        let offset = count(item.range.first)? * WORD;
        gl.draw_elements_with_i32(mode, count(item.range.count)?, Gl::UNSIGNED_INT, offset);
        Ok(())
    }

    /// Libère programme, VAO et tampons (le contexte vivant les possède).
    pub fn free(&self, gl: &Gl) {
        gl.delete_program(Some(&self.program));
        gl.delete_vertex_array(Some(&self.vao));
        for buffer in &self.buffers {
            gl.delete_buffer(Some(buffer));
        }
    }
}

/// Uniformes constants de la scène : lumière, ambiante, bornes du brouillard.
fn constants(gl: &Gl, program: &WebGlProgram) {
    let at = |name: &str| gl.get_uniform_location(program, name);
    gl.uniform3f(at("u_light").as_ref(), LIGHT.x, LIGHT.y, LIGHT.z);
    gl.uniform1f(at("u_ambient").as_ref(), AMBIENT);
    gl.uniform2f(at("u_fog_range").as_ref(), FOG_START, FOG_END);
}
