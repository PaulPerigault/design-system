//! Contraste WCAG 2 et APCA : chaque fonction délègue à `pp-color`.
use crate::color::srgb;
use crate::fault::fault;
use pp_color::Oklch;
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

type Out<T> = Result<T, JsValue>;

fn channels(color: pp_color::Srgb) -> Vec<f64> {
    color.channels().to_vec()
}

/// `#rrggbb` → canaux sRGB gamma dans [0, 1].
#[wasm_bindgen(js_name = parseHex)]
pub fn parse_hex(text: &str) -> Out<Vec<f64>> {
    pp_color::parse_hex(text).map(channels).map_err(fault)
}

/// OKLCH → canaux sRGB rendus dans [0, 1] ; hors gamut : `out-of-gamut`.
#[wasm_bindgen(js_name = renderedSrgb)]
pub fn rendered_srgb(l: f64, c: f64, h: f64) -> Out<Vec<f64>> {
    let color = Oklch::new(l, c, h).map_err(fault)?;
    pp_color::rendered_srgb(color).map(channels).map_err(fault)
}

#[wasm_bindgen(js_name = relativeLuminance)]
pub fn relative_luminance(color: &[f64]) -> Out<f64> {
    pp_color::relative_luminance(srgb(color)?).map_err(fault)
}

#[wasm_bindgen(js_name = contrastRatio)]
pub fn contrast_ratio(a: &[f64], b: &[f64]) -> Out<f64> {
    pp_color::contrast_ratio(srgb(a)?, srgb(b)?).map_err(fault)
}

#[wasm_bindgen(js_name = apcaLc)]
pub fn apca_lc(text: &[f64], background: &[f64]) -> Out<f64> {
    pp_color::apca_lc(srgb(text)?, srgb(background)?).map_err(fault)
}
