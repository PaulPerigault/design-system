//! Conversions, gamut et hexadécimal : chaque fonction délègue à `pp-color`.
use crate::fault::{bad_length, fault};
use pp_color::{LinearSrgb, Oklch, Srgb};
use wasm_bindgen::JsValue;
use wasm_bindgen::prelude::wasm_bindgen;

type Out<T> = Result<T, JsValue>;

fn oklch(l: f64, c: f64, h: f64) -> Out<Oklch> {
    Oklch::new(l, c, h).map_err(fault)
}

pub(crate) fn srgb(channels: &[f64]) -> Out<Srgb> {
    match *channels {
        [r, g, b] => Srgb::new(r, g, b).map_err(fault),
        _ => Err(bad_length()),
    }
}

fn from_oklch(color: Oklch) -> Vec<f64> {
    vec![color.lightness(), color.chroma(), color.hue()]
}

fn from_linear(color: LinearSrgb) -> Vec<f64> {
    color.channels().to_vec()
}

#[wasm_bindgen(js_name = oklchToLinearSrgb)]
pub fn oklch_to_linear_srgb(l: f64, c: f64, h: f64) -> Out<Vec<f64>> {
    pp_color::oklch_to_linear_srgb(oklch(l, c, h)?)
        .map(from_linear)
        .map_err(fault)
}

#[wasm_bindgen(js_name = oklchToSrgb)]
pub fn oklch_to_srgb(l: f64, c: f64, h: f64) -> Out<Vec<f64>> {
    pp_color::oklch_to_srgb(oklch(l, c, h)?)
        .map(|color| color.channels().to_vec())
        .map_err(fault)
}

#[wasm_bindgen(js_name = srgbToOklch)]
pub fn srgb_to_oklch(channels: &[f64]) -> Out<Vec<f64>> {
    pp_color::srgb_to_oklch(srgb(channels)?)
        .map(from_oklch)
        .map_err(fault)
}

#[wasm_bindgen(js_name = linearToGamma)]
#[must_use]
pub fn linear_to_gamma(value: f64) -> f64 {
    pp_color::linear_to_gamma(value)
}

#[wasm_bindgen(js_name = gammaToLinear)]
#[must_use]
pub fn gamma_to_linear(value: f64) -> f64 {
    pp_color::gamma_to_linear(value)
}

#[wasm_bindgen(js_name = inSrgbGamut)]
pub fn in_srgb_gamut(l: f64, c: f64, h: f64, epsilon: f64) -> Out<bool> {
    pp_color::in_srgb_gamut_within(oklch(l, c, h)?, epsilon).map_err(fault)
}

#[wasm_bindgen(js_name = fitToGamut)]
pub fn fit_to_gamut(l: f64, c: f64, h: f64) -> Out<Vec<f64>> {
    Ok(from_oklch(pp_color::fit_to_gamut(oklch(l, c, h)?)))
}

#[wasm_bindgen(js_name = toHex)]
pub fn to_hex(l: f64, c: f64, h: f64) -> Out<String> {
    pp_color::to_hex(oklch(l, c, h)?).map_err(fault)
}

#[wasm_bindgen(js_name = hexToOklch)]
pub fn hex_to_oklch(text: &str) -> Out<Vec<f64>> {
    pp_color::hex_to_oklch(text).map(from_oklch).map_err(fault)
}
