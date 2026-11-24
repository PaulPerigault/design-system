//! Types exposés à JavaScript. Chaque méthode délègue à `SceneState` ou à la couche GL.
use crate::convert::{Out, ms};
use crate::fault::raise;
use crate::gl::{context, release};
use crate::gpu::Gpu;
use crate::input::build;
use crate::stages::{Builder, build_all};
use pp_milestones::SceneState;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::{HtmlCanvasElement, WebGl2RenderingContext as Gl, WebGlBuffer, WebGlSync};

#[wasm_bindgen]
pub struct Scene {
    pub(crate) canvas: HtmlCanvasElement,
    pub(crate) gl: Gl,
    pub(crate) state: SceneState,
    pub(crate) gpu: Option<Gpu>,
    /// Initialisation du GPU en cours (`gpuStep`) ; rien ne se dessine tant qu'elle dure.
    pub(crate) builder: Option<Builder>,
    /// Clôture du tracé de préchauffage (voir `warm.rs`).
    pub(crate) fence: Option<WebGlSync>,
    /// Clôture de `idle` (le GPU a rattrapé son retard).
    pub(crate) idle_fence: Option<WebGlSync>,
    /// Tampon de la lecture d'un pixel du préchauffage, libéré avec la clôture.
    pub(crate) probe: Option<WebGlBuffer>,
}

#[wasm_bindgen]
impl Scene {
    /// # Errors
    /// Code de la scène ou de WebGL (`gl-unavailable`) ; le GPU s'initialise ensuite par `gpuStep`.
    #[wasm_bindgen(constructor)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "wasm-bindgen ne reçoit un tableau de chaînes que par valeur"
    )]
    pub fn new(
        canvas: HtmlCanvasElement,
        ids: Vec<String>,
        statuses: Vec<String>,
        badges: &[u8],
        goal: bool,
        theme: &[f32],
        active: &str,
    ) -> Out<Scene> {
        let state = build((&ids, &statuses, badges), goal, theme, active).map_err(raise)?;
        let gl = context(&canvas).map_err(raise)?;
        Ok(Scene {
            canvas,
            gl,
            state,
            gpu: None,
            builder: Some(Builder::default()),
            fence: None,
            idle_fence: None,
            probe: None,
        })
    }

    /// Dessine une image ; vrai si une autre image est due (transition ou inclinaison en cours).
    /// Toute commande (progression, survol, actif, thème, taille) demande une image.
    pub fn frame(&mut self, now: f64) -> Out<bool> {
        self.render(now)
    }

    /// Le contexte est perdu : ses ressources n'existent plus, rien à libérer.
    #[wasm_bindgen(js_name = contextLost)]
    pub fn context_lost(&mut self) {
        self.gpu = None;
        self.builder = None;
    }

    /// Le contexte est revenu : programmes et tampons.
    #[wasm_bindgen(js_name = contextRestored)]
    pub fn context_restored(&mut self) -> Out<()> {
        let gpu = build_all(&self.gl, self.state.pack()).map_err(raise)?;
        self.gpu = Some(gpu);
        Ok(())
    }

    /// Libère les ressources et rend le contexte au navigateur.
    pub fn destroy(&mut self) {
        if let Some(mut builder) = self.builder.take() {
            builder.free(&self.gl);
        }
        if let Some(gpu) = self.gpu.take() {
            gpu.free(&self.gl);
        }
        self.gl.delete_sync(self.fence.take().as_ref());
        self.gl.delete_sync(self.idle_fence.take().as_ref());
        self.gl.delete_buffer(self.probe.take().as_ref());
        release(&self.gl);
    }
}

impl Scene {
    /// Dessine une image (le préchauffage de `warm.rs` en trace une aussi).
    pub(crate) fn render(&mut self, now: f64) -> Out<bool> {
        let frame = self.state.frame(ms(now));
        if let Some(gpu) = &self.gpu {
            let (width, height) = (self.canvas.width(), self.canvas.height());
            let gl = &self.gl;
            gl.viewport(
                0,
                0,
                i32::try_from(width).unwrap_or(0),
                i32::try_from(height).unwrap_or(0),
            );
            gl.enable(Gl::DEPTH_TEST);
            gl.enable(Gl::BLEND);
            gl.blend_func(Gl::ONE, Gl::ONE_MINUS_SRC_ALPHA);
            gl.clear_color(0.0, 0.0, 0.0, 0.0);
            gl.clear(Gl::COLOR_BUFFER_BIT | Gl::DEPTH_BUFFER_BIT);
            gpu.draw(gl, &frame).map_err(raise)?;
        }
        Ok(frame.animating)
    }
}
