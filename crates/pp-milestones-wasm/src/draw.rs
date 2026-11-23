//! Appels de dessin : une passe sur la liste de dessin de l'image, sans décision.
use crate::fault::Fault;
use crate::gpu::{Gpu, Uniforms, WORD, count};
use pp_milestones::Frame;
use pp_milestones::geometry::pack::Mode;
use pp_milestones::plan::DrawItem;
use web_sys::WebGl2RenderingContext as Gl;

impl Gpu {
    /// `warm` : les faces sans badge reçu sont tracées avec la texture de remplacement (préchauffage).
    pub fn draw(&self, gl: &Gl, frame: &Frame, warm: bool) -> Result<(), Fault> {
        gl.bind_vertex_array(Some(&self.vao));
        let matrix = frame.view_projection.to_cols_array();
        for program in [&self.solid, &self.badge] {
            gl.use_program(Some(&program.program));
            gl.uniform_matrix4fv_with_f32_array(program.view_projection.as_ref(), false, &matrix);
        }
        for item in &frame.items {
            match item.texture {
                Some(index) => self.badge_face(gl, item, index, warm)?,
                None => self.surface(gl, item)?,
            }
        }
        Ok(())
    }

    fn surface(&self, gl: &Gl, item: &DrawItem) -> Result<(), Fault> {
        let program = &self.solid;
        gl.use_program(Some(&program.program));
        let [r, g, b] = item.color;
        gl.uniform3f(program.color.as_ref(), r, g, b);
        gl.uniform1f(program.lit.as_ref(), f32::from(u8::from(item.lit)));
        gl.uniform1f(program.fade.as_ref(), f32::from(u8::from(item.fade)));
        indexed(gl, program, item)
    }

    /// Face du badge : sans texture reçue, rien n'est tracé (le support seul reste visible), sauf
    /// au préchauffage, où la texture de remplacement (transparente) prend sa place.
    fn badge_face(&self, gl: &Gl, item: &DrawItem, index: usize, warm: bool) -> Result<(), Fault> {
        let received = self.textures.get(index).and_then(Option::as_ref);
        let Some(texture) = received.or(warm.then_some(&self.placeholder)) else {
            return Ok(());
        };
        gl.use_program(Some(&self.badge.program));
        gl.active_texture(Gl::TEXTURE0);
        gl.bind_texture(Gl::TEXTURE_2D, Some(texture));
        indexed(gl, &self.badge, item)
    }
}

fn indexed(gl: &Gl, program: &Uniforms, item: &DrawItem) -> Result<(), Fault> {
    let model = item.model.to_cols_array();
    gl.uniform_matrix4fv_with_f32_array(program.model.as_ref(), false, &model);
    let mode = match item.range.mode {
        Mode::Triangles => Gl::TRIANGLES,
        Mode::Lines => Gl::LINES,
    };
    let offset = count(item.range.first)? * WORD;
    gl.draw_elements_with_i32(mode, count(item.range.count)?, Gl::UNSIGNED_INT, offset);
    Ok(())
}
