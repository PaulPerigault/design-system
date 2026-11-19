//! Commandes JavaScript de la scène : taille, thème, jalon actif, pointeur, gyroscope, sélection.
use crate::bindings::Scene;
use crate::convert::{Out, ms};
use crate::fault::raise;
use pp_milestones::{Theme, Vec2};
use wasm_bindgen::prelude::wasm_bindgen;

#[wasm_bindgen]
impl Scene {
    pub fn resize(&mut self, width: u32, height: u32) -> Out<()> {
        self.canvas.set_width(width);
        self.canvas.set_height(height);
        #[allow(clippy::cast_precision_loss, reason = "dimensions de canvas")]
        self.state
            .resize(width as f32, height as f32)
            .map_err(|e| raise(e.into()))
    }

    #[wasm_bindgen(js_name = setTheme)]
    pub fn set_theme(&mut self, theme: &[f32]) -> Out<()> {
        self.state
            .set_theme(Theme::from_slice(theme).map_err(|e| raise(e.into()))?);
        Ok(())
    }

    #[wasm_bindgen(js_name = setActive)]
    pub fn set_active(&mut self, id: &str, now: f64) -> Out<()> {
        self.state
            .set_active_id(id, ms(now))
            .map_err(|e| raise(e.into()))
    }

    #[wasm_bindgen(js_name = activeId)]
    pub fn active_id(&self) -> Option<String> {
        self.state.active_id().map(str::to_owned)
    }

    #[wasm_bindgen(js_name = pointerMove)]
    pub fn pointer_move(&mut self, x: f32, y: f32) {
        self.state.pointer_move(Vec2::new(x, y));
    }

    #[wasm_bindgen(js_name = pointerLeave)]
    pub fn pointer_leave(&mut self) {
        self.state.pointer_leave();
    }

    /// Inclinaison de l'appareil, normalisée ; des valeurs non finies rendent la main au pointeur.
    #[wasm_bindgen(js_name = setGyro)]
    pub fn set_gyro(&mut self, x: f32, y: f32) {
        let tilt = Vec2::new(x, y);
        self.state.set_gyro(tilt.is_finite().then_some(tilt));
    }

    /// Identifiant du jalon sous le point visé (coordonnées normalisées, y vers le haut).
    pub fn pick(&self, x: f32, y: f32, now: f64) -> Option<String> {
        let index = self.state.pick(Vec2::new(x, y), ms(now))?;
        self.state.id_at(index).map(str::to_owned)
    }
}
