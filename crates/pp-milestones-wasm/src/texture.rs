//! Textures des badges : `ImageBitmap` envoyé tel quel, sans recadrage ni conversion.
//!
//! Contrat avec l'enveloppe TypeScript : le bitmap est créé par `createImageBitmap` avec
//! `premultiplyAlpha: 'premultiply'`, `colorSpaceConversion: 'none'`, `imageOrientation: 'none'` et
//! redimensionné à 512 px au plus. La spécification WebGL ignore les réglages `UNPACK_*` pour un
//! `ImageBitmap` (ce sont les options de création qui valent) ; ils sont posés ici quand même pour
//! que la source soit explicite et que le comportement ne dépende pas du navigateur.
//! Première ligne de l'image en haut : v = 0 en haut dans le maillage (`medal::badge`).
use crate::bindings::Scene;
use crate::convert::Out;
use crate::fault::{GlFault, raise};
use pp_milestones::SceneError;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::{ImageBitmap, WebGl2RenderingContext as Gl, WebGlTexture};

/// `EXT_texture_filter_anisotropic` : `TEXTURE_MAX_ANISOTROPY_EXT` et `MAX_TEXTURE_MAX_ANISOTROPY_EXT`.
const TEXTURE_MAX_ANISOTROPY: u32 = 0x84FE;
const MAX_TEXTURE_MAX_ANISOTROPY: u32 = 0x84FF;
/// Filtrage anisotrope visé (une face vue de biais reste nette sans coût notable).
const ANISOTROPY_TARGET: f32 = 8.0;

/// Limite d'anisotropie à appliquer, `None` si l'extension manque.
#[allow(
    clippy::cast_possible_truncation,
    reason = "un facteur d'anisotropie est petit"
)]
pub fn anisotropy_limit(gl: &Gl) -> Option<f32> {
    gl.get_extension("EXT_texture_filter_anisotropic")
        .ok()
        .flatten()?;
    let max = gl
        .get_parameter(MAX_TEXTURE_MAX_ANISOTROPY)
        .ok()?
        .as_f64()?;
    Some((max as f32).min(ANISOTROPY_TARGET))
}

pub fn upload(
    gl: &Gl,
    bitmap: &ImageBitmap,
    anisotropy: Option<f32>,
) -> Result<WebGlTexture, GlFault> {
    let texture = gl.create_texture().ok_or(GlFault::Resource)?;
    gl.bind_texture(Gl::TEXTURE_2D, Some(&texture));
    gl.pixel_storei(Gl::UNPACK_FLIP_Y_WEBGL, 0);
    gl.pixel_storei(Gl::UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    #[allow(clippy::cast_possible_wrap, reason = "constante WebGL (0)")]
    gl.pixel_storei(Gl::UNPACK_COLORSPACE_CONVERSION_WEBGL, Gl::NONE as i32);
    #[allow(clippy::cast_possible_wrap, reason = "constante WebGL (RGBA = 0x1908)")]
    let format = Gl::RGBA as i32;
    gl.tex_image_2d_with_u32_and_u32_and_image_bitmap(
        Gl::TEXTURE_2D,
        0,
        format,
        Gl::RGBA,
        Gl::UNSIGNED_BYTE,
        bitmap,
    )
    .map_err(|_| GlFault::Resource)?;
    gl.generate_mipmap(Gl::TEXTURE_2D);
    set_sampler(gl, anisotropy);
    Ok(texture)
}

/// Filtrage et bords d'une texture de badge (la texture liée à `TEXTURE_2D`).
fn set_sampler(gl: &Gl, anisotropy: Option<f32>) {
    #[allow(clippy::cast_possible_wrap, reason = "constantes WebGL (≤ 0x2900)")]
    let set = |name: u32, value: u32| gl.tex_parameteri(Gl::TEXTURE_2D, name, value as i32);
    set(Gl::TEXTURE_MIN_FILTER, Gl::LINEAR_MIPMAP_LINEAR);
    set(Gl::TEXTURE_MAG_FILTER, Gl::LINEAR);
    set(Gl::TEXTURE_WRAP_S, Gl::CLAMP_TO_EDGE);
    set(Gl::TEXTURE_WRAP_T, Gl::CLAMP_TO_EDGE);
    if let Some(level) = anisotropy {
        gl.tex_parameterf(Gl::TEXTURE_2D, TEXTURE_MAX_ANISOTROPY, level);
    }
}

/// Texture de 1 pixel transparent, avec les mêmes réglages qu'un badge : elle sert à préchauffer le
/// tracé des faces (voir `Scene::warm_frame`), jamais à l'affichage.
pub fn placeholder(gl: &Gl, anisotropy: Option<f32>) -> Result<WebGlTexture, GlFault> {
    let texture = gl.create_texture().ok_or(GlFault::Resource)?;
    gl.bind_texture(Gl::TEXTURE_2D, Some(&texture));
    #[allow(clippy::cast_possible_wrap, reason = "constante WebGL (RGBA = 0x1908)")]
    let format = Gl::RGBA as i32;
    gl.tex_image_2d_with_i32_and_i32_and_i32_and_format_and_type_and_opt_u8_array(
        Gl::TEXTURE_2D,
        0,
        format,
        1,
        1,
        0,
        Gl::RGBA,
        Gl::UNSIGNED_BYTE,
        Some(&[0, 0, 0, 0]),
    )
    .map_err(|_| GlFault::Resource)?;
    gl.generate_mipmap(Gl::TEXTURE_2D);
    set_sampler(gl, anisotropy);
    Ok(texture)
}

#[wasm_bindgen]
impl Scene {
    /// Badge du jalon `id` : le bitmap est conservé (recréation après perte de contexte) et libéré
    /// par `destroy()` ou au remplacement. Un identifiant inconnu, ou l'objectif, est refusé.
    ///
    /// # Errors
    /// `unknown-id`, ou `gl-resource` si l'envoi au GPU échoue (le bitmap reste conservé).
    #[wasm_bindgen(js_name = setTexture)]
    pub fn set_texture(&mut self, id: &str, bitmap: ImageBitmap) -> Out<()> {
        let index = (self.state.data().index_of(id))
            .filter(|i| *i < self.bitmaps.len())
            .ok_or_else(|| raise(SceneError::UnknownId.into()))?;
        let Some(slot) = self.bitmaps.get_mut(index) else {
            return Ok(());
        };
        if let Some(old) = slot.replace(bitmap) {
            old.close();
        }
        let Some(gpu) = self.gpu.as_mut() else {
            return Ok(());
        };
        let fresh = slot
            .as_ref()
            .map(|b| upload(&self.gl, b, gpu.anisotropy))
            .transpose()
            .map_err(|e| raise(e.into()))?;
        if let Some(old) = gpu
            .textures
            .get_mut(index)
            .map(|t| core::mem::replace(t, fresh))
        {
            self.gl.delete_texture(old.as_ref());
        }
        Ok(())
    }
}
