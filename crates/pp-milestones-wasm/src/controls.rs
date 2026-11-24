//! Commandes JavaScript de la scène : taille, thème, progression, actif, survol, pointeur, sélection.
use crate::bindings::Scene;
use crate::convert::Out;
use crate::fault::raise;
use pp_milestones::{Theme, Vec2};
use wasm_bindgen::prelude::wasm_bindgen;

/// Progression rendue pour un identifiant inconnu (jamais `NaN` : les valeurs valides sont dans [0, 1]).
const UNKNOWN_PROGRESS: f32 = -1.0;

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

    /// Canevas compact (étroit en pixels CSS) : cadrage de la médaille active seule, en grand.
    #[wasm_bindgen(js_name = setCompact)]
    pub fn set_compact(&mut self, compact: bool) {
        self.state.set_compact(compact);
    }

    #[wasm_bindgen(js_name = setTheme)]
    pub fn set_theme(&mut self, theme: &[f32]) -> Out<()> {
        self.state
            .set_theme(Theme::from_slice(theme).map_err(|e| raise(e.into()))?);
        Ok(())
    }

    /// Progression de 0 (première étape) à 1 (dernière) ; appliquée à la prochaine image.
    #[wasm_bindgen(js_name = setProgress)]
    pub fn set_progress(&mut self, progress: f32) -> Out<()> {
        self.state
            .set_progress(progress)
            .map_err(|e| raise(e.into()))
    }

    /// Progression d'une étape (jalon ou `@goal`), -1 si l'identifiant est inconnu.
    #[wasm_bindgen(js_name = progressOf)]
    pub fn progress_of(&self, id: &str) -> f32 {
        self.state.progress_of_id(id).unwrap_or(UNKNOWN_PROGRESS)
    }

    /// Étape active (anneau d'accent) ; chaîne vide : aucune. Faux si l'identifiant est inconnu.
    #[wasm_bindgen(js_name = setActive)]
    pub fn set_active(&mut self, id: &str) -> bool {
        self.state.set_active_id(id)
    }

    /// Étape survolée (anneau, inclinaison) ; chaîne vide ou inconnue : aucune.
    #[wasm_bindgen(js_name = setHover)]
    pub fn set_hover(&mut self, id: &str) {
        self.state.set_hover_id(id);
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

    /// Identifiant de l'étape sous le point visé (coordonnées normalisées de -1 à 1, y vers le
    /// haut), chaîne vide s'il n'y en a pas.
    pub fn pick(&self, x: f32, y: f32) -> String {
        let index = self.state.pick(Vec2::new(x, y));
        index
            .and_then(|i| self.state.id_at(i))
            .map(str::to_owned)
            .unwrap_or_default()
    }

    /// Quatre nombres par étape, jalons puis objectif : x, y (de 0 à 1, origine en haut à gauche
    /// du canvas), rayon de la médaille rapporté à la hauteur du canvas, visibilité (1 ou 0).
    pub fn project(&self) -> Vec<f32> {
        self.state
            .project()
            .into_iter()
            .flat_map(|p| [p.x, p.y, p.scale, f32::from(u8::from(p.visible))])
            .collect()
    }
}
