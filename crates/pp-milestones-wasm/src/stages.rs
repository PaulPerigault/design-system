//! Initialisation du GPU par étapes : chaque appel de `Builder::step` fait un morceau borné du
//! travail (un programme, un tampon), pour que l'enveloppe TypeScript rende la main au navigateur
//! entre deux étapes (audit #394 : compilation, liaison et envoi des tampons formaient une tâche
//! longue sous rastériseur logiciel). Les shaders sont émis d'abord sans lire leur état ; avec
//! `KHR_parallel_shader_compile`, la lecture attend la fin de la compilation côté GPU (`Wait`),
//! sans elle chaque lecture est une étape à part.
use crate::bindings::Scene;
use crate::convert::Out;
use crate::fault::raise;
use crate::fault::{Fault, GlFault};
use crate::gpu::{Gpu, Uniforms, WORD, constants, count, locate, upload_buffer};
use crate::shaders::{Linking, SOLID, discard, is_complete, issue, verify};
use pp_milestones::geometry::mesh::FLOATS_PER_VERTEX;
use pp_milestones::geometry::pack::Pack;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::{WebGl2RenderingContext as Gl, WebGlBuffer, WebGlVertexArrayObject};

/// Emplacements des attributs (`layout(location)` du sommet partagé) : taille en flottants.
const VECTOR: i32 = 3;
const UV: i32 = 2;
const ATTRIBUTES: [(u32, i32); 3] = [(0, VECTOR), (1, VECTOR), (2, UV)];
const FRAGMENTS: [&str; 1] = [SOLID];

/// Résultat d'une étape.
pub enum Step {
    /// Du travail reste : rappeler après avoir rendu la main.
    More,
    /// Le GPU compile encore : rappeler un peu plus tard.
    Wait,
    Done(Gpu),
}

#[derive(Default)]
pub struct Builder {
    parallel: bool,
    linking: Vec<Linking>,
    ready: Vec<Uniforms>,
    vao: Option<WebGlVertexArrayObject>,
    vertices: Option<WebGlBuffer>,
    indices: Option<WebGlBuffer>,
}

impl Builder {
    /// Une étape : programme émis, programme lu, tampon des sommets, tampon des indices, ou fin.
    pub fn step(&mut self, gl: &Gl, pack: &Pack) -> Result<Step, Fault> {
        let issued = self.linking.len() + self.ready.len();
        if issued < FRAGMENTS.len() {
            return self.issue_next(gl, issued);
        }
        if self.ready.len() < FRAGMENTS.len() {
            return self.verify_next(gl);
        }
        if self.vertices.is_none() {
            return self.send_vertices(gl, pack);
        }
        if self.indices.is_none() {
            let vao = self.vao.as_ref().ok_or(GlFault::Resource)?;
            gl.bind_vertex_array(Some(vao));
            self.indices = Some(upload_buffer(
                gl,
                Gl::ELEMENT_ARRAY_BUFFER,
                &pack.index_bytes(),
            )?);
            return Ok(Step::More);
        }
        self.finish(gl).map(Step::Done)
    }

    fn issue_next(&mut self, gl: &Gl, issued: usize) -> Result<Step, Fault> {
        if issued == 0 {
            self.parallel = matches!(gl.get_extension("KHR_parallel_shader_compile"), Ok(Some(_)));
        }
        let fragment = FRAGMENTS.get(issued).ok_or(GlFault::Resource)?;
        self.linking.push(issue(gl, fragment)?);
        Ok(Step::More)
    }

    fn verify_next(&mut self, gl: &Gl) -> Result<Step, Fault> {
        let Some(first) = self.linking.first() else {
            return Err(GlFault::Resource.into());
        };
        if self.parallel && !is_complete(gl, first) {
            return Ok(Step::Wait);
        }
        let linking = self.linking.remove(0);
        self.ready.push(locate(gl, verify(gl, linking)?));
        Ok(Step::More)
    }

    fn send_vertices(&mut self, gl: &Gl, pack: &Pack) -> Result<Step, Fault> {
        let vao = gl.create_vertex_array().ok_or(GlFault::Resource)?;
        gl.bind_vertex_array(Some(&vao));
        self.vertices = Some(upload_buffer(gl, Gl::ARRAY_BUFFER, &pack.vertex_bytes())?);
        let stride = count(FLOATS_PER_VERTEX)? * WORD;
        let mut offset = 0;
        for (location, size) in ATTRIBUTES {
            gl.enable_vertex_attrib_array(location);
            gl.vertex_attrib_pointer_with_i32(location, size, Gl::FLOAT, false, stride, offset);
            offset += size * WORD;
        }
        self.vao = Some(vao);
        Ok(Step::More)
    }

    fn finish(&mut self, gl: &Gl) -> Result<Gpu, Fault> {
        let (Some(vao), Some(vertices), Some(indices)) =
            (self.vao.take(), self.vertices.take(), self.indices.take())
        else {
            return Err(GlFault::Resource.into());
        };
        let mut ready = core::mem::take(&mut self.ready).into_iter();
        let Some(solid) = ready.next() else {
            return Err(GlFault::Resource.into());
        };
        constants(gl, &solid.program);
        Ok(Gpu {
            solid,
            vao,
            buffers: [vertices, indices],
        })
    }

    /// Libère ce qui a été créé avant la fin (destruction ou échec en cours d'initialisation).
    pub fn free(&mut self, gl: &Gl) {
        self.linking.iter().for_each(|linking| discard(gl, linking));
        self.linking.clear();
        for uniforms in self.ready.drain(..) {
            gl.delete_program(Some(&uniforms.program));
        }
        gl.delete_vertex_array(self.vao.take().as_ref());
        gl.delete_buffer(self.vertices.take().as_ref());
        gl.delete_buffer(self.indices.take().as_ref());
    }
}

/// Toutes les étapes d'un coup (restauration d'un contexte perdu : rare, jamais au chargement).
pub fn build_all(gl: &Gl, pack: &Pack) -> Result<Gpu, Fault> {
    let mut builder = Builder::default();
    loop {
        match builder.step(gl, pack) {
            Ok(Step::Done(gpu)) => return Ok(gpu),
            Ok(Step::More | Step::Wait) => {}
            Err(fault) => {
                builder.free(gl);
                return Err(fault);
            }
        }
    }
}

/// Valeurs rendues par `gpuStep` (miroir de `packages/milestones-3d/src/raw.ts`).
pub const GPU_DONE: u8 = 0;
pub const GPU_MORE: u8 = 1;
pub const GPU_WAIT: u8 = 2;

#[wasm_bindgen]
impl Scene {
    /// Une étape de l'initialisation du GPU : `0` terminé, `1` d'autres étapes suivent, `2` le GPU
    /// compile encore. Sans effet une fois terminé. Aucune image n'est dessinée avant la fin.
    ///
    /// # Errors
    /// Code de WebGL (`shader-compile`, `program-link`, `gl-resource`) ; les ressources déjà créées
    /// sont libérées.
    #[wasm_bindgen(js_name = gpuStep)]
    pub fn gpu_step(&mut self) -> Out<u8> {
        let Some(builder) = self.builder.as_mut() else {
            return Ok(GPU_DONE);
        };
        match builder.step(&self.gl, self.state.pack()) {
            Ok(Step::More) => Ok(GPU_MORE),
            Ok(Step::Wait) => Ok(GPU_WAIT),
            Ok(Step::Done(gpu)) => {
                self.gpu = Some(gpu);
                self.builder = None;
                Ok(GPU_DONE)
            }
            Err(fault) => {
                builder.free(&self.gl);
                self.builder = None;
                Err(raise(fault))
            }
        }
    }
}
