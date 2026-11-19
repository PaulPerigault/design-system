//! Types exposés à JavaScript. Chaque méthode délègue à `SceneState` ou à la couche GL.
use crate::convert::{Out, ms};
use crate::draw::Gpu;
use crate::fault::raise;
use crate::gl::{context, release};
use crate::input::build;
use pp_milestones::SceneState;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::{HtmlCanvasElement, WebGl2RenderingContext as Gl};

#[wasm_bindgen]
pub struct Scene {
    pub(crate) canvas: HtmlCanvasElement,
    pub(crate) gl: Gl,
    pub(crate) state: SceneState,
    pub(crate) gpu: Option<Gpu>,
}

#[wasm_bindgen]
impl Scene {
    /// # Errors
    /// Code de la scène ou de WebGL (`gl-unavailable`, `shader-compile`, `program-link`…).
    #[wasm_bindgen(constructor)]
    #[allow(
        clippy::needless_pass_by_value,
        reason = "wasm-bindgen ne reçoit un tableau de chaînes que par valeur"
    )]
    pub fn new(
        canvas: HtmlCanvasElement,
        ids: Vec<String>,
        statuses: Vec<String>,
        emblems: Vec<String>,
        goal: bool,
        theme: &[f32],
        active: &str,
    ) -> Out<Scene> {
        let state = build([&ids, &statuses, &emblems], goal, theme, active).map_err(raise)?;
        let gl = context(&canvas).map_err(raise)?;
        let gpu = Gpu::new(&gl, state.pack()).map_err(raise)?;
        Ok(Scene {
            canvas,
            gl,
            state,
            gpu: Some(gpu),
        })
    }

    /// Dessine une image ; vrai si une autre image est due (transition ou inclinaison en cours).
    pub fn frame(&mut self, now: f64) -> Out<bool> {
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
            gl.clear_color(0.0, 0.0, 0.0, 0.0);
            gl.clear(Gl::COLOR_BUFFER_BIT | Gl::DEPTH_BUFFER_BIT);
            gpu.draw(gl, &frame, self.state.theme()).map_err(raise)?;
        }
        Ok(frame.animating)
    }

    /// Le contexte est perdu : ses ressources n'existent plus, rien à libérer.
    #[wasm_bindgen(js_name = contextLost)]
    pub fn context_lost(&mut self) {
        self.gpu = None;
    }

    /// Le contexte est revenu : programme et tampons sont recréés.
    #[wasm_bindgen(js_name = contextRestored)]
    pub fn context_restored(&mut self) -> Out<()> {
        self.gpu = Some(Gpu::new(&self.gl, self.state.pack()).map_err(raise)?);
        Ok(())
    }

    /// Libère les ressources et rend le contexte au navigateur.
    pub fn destroy(&mut self) {
        if let Some(gpu) = self.gpu.take() {
            gpu.free(&self.gl);
        }
        release(&self.gl);
    }
}
