//! Contexte WebGL2 : création, libération. Perte et restauration : voir `Scene` (bindings).
use crate::fault::{Fault, GlFault};
use wasm_bindgen::JsCast;
use web_sys::{
    HtmlCanvasElement, WebGl2RenderingContext, WebGlContextAttributes, WebGlPowerPreference,
    WebglLoseContext,
};

/// Contexte transparent (la page garde son fond), avec profondeur et anticrénelage, sobre en énergie.
pub fn context(canvas: &HtmlCanvasElement) -> Result<WebGl2RenderingContext, Fault> {
    let attributes = WebGlContextAttributes::new();
    attributes.set_alpha(true);
    attributes.set_depth(true);
    attributes.set_antialias(true);
    attributes.set_premultiplied_alpha(true);
    attributes.set_preserve_drawing_buffer(false);
    attributes.set_power_preference(WebGlPowerPreference::LowPower);
    canvas
        .get_context_with_context_options("webgl2", &attributes)
        .ok()
        .flatten()
        .and_then(|object| object.dyn_into::<WebGl2RenderingContext>().ok())
        .ok_or_else(|| GlFault::Unavailable.into())
}

/// Rend le contexte au navigateur au plus tôt (le nombre de contextes actifs est plafonné).
pub fn release(gl: &WebGl2RenderingContext) {
    let extension = gl
        .get_extension("WEBGL_lose_context")
        .ok()
        .flatten()
        .and_then(|object| object.dyn_into::<WebglLoseContext>().ok());
    if let Some(extension) = extension {
        extension.lose_context();
    }
}
