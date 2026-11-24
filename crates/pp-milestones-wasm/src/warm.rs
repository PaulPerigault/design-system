//! Préchauffage du tracé (audit #394). Sans carte graphique, le navigateur compose le canvas WebGL
//! en lisant ses pixels (`ReadPixels`), et cette lecture attend que le GPU logiciel ait exécuté ce
//! qui a été tracé, y compris la compilation à la volée de ses routines : 60 à 85 ms d'attente du
//! fil principal à la première image. L'enveloppe cache donc le canvas,
//! trace une image d'essai (mêmes programmes et tampons que les images visibles), attend la clôture
//! sans bloquer (`warmed`), puis le montre : les images visibles n'attendent plus rien.
use crate::bindings::Scene;
use crate::convert::Out;
use wasm_bindgen::prelude::wasm_bindgen;
use web_sys::WebGl2RenderingContext as Gl;

/// Octets d'un pixel RGBA.
const PIXEL_BYTES: i32 = 4;

#[wasm_bindgen]
impl Scene {
    /// Trace une image d'essai et pose une clôture derrière. Sans effet tant que le GPU n'est pas prêt.
    ///
    /// # Errors
    /// Code de WebGL si le tracé échoue.
    #[wasm_bindgen(js_name = warmFrame)]
    pub fn warm_frame(&mut self, now: f64) -> Out<()> {
        if self.gpu.is_none() {
            return Ok(());
        }
        self.render(now)?;
        self.read_back_one_pixel();
        self.fence = self.gl.fence_sync(Gl::SYNC_GPU_COMMANDS_COMPLETE, 0);
        // La clôture ne se signale que si les commandes qui la précèdent sont envoyées (Firefox).
        self.gl.flush();
        Ok(())
    }

    /// Vrai quand le GPU a rattrapé tout ce qui lui a été envoyé : la clôture est posée au premier
    /// appel et interrogée ensuite, sans jamais bloquer. Un appel synchrone (redimensionnement du
    /// canvas) attend sinon toute la file du GPU, tracé des tuiles de la page compris.
    pub fn idle(&mut self) -> bool {
        let Some(fence) = &self.idle_fence else {
            self.gl.flush();
            self.idle_fence = self.gl.fence_sync(Gl::SYNC_GPU_COMMANDS_COMPLETE, 0);
            self.gl.flush();
            return self.idle_fence.is_none();
        };
        let status = self.gl.get_sync_parameter(fence, Gl::SYNC_STATUS).as_f64();
        let signaled = status.is_some_and(|value| (value - f64::from(Gl::SIGNALED)).abs() < 0.5);
        if signaled {
            self.gl.delete_sync(self.idle_fence.take().as_ref());
        }
        signaled
    }

    /// Vrai quand le GPU a fini l'image d'essai (ou qu'il n'y en a pas) ; ne bloque jamais.
    pub fn warmed(&mut self) -> bool {
        let Some(fence) = &self.fence else {
            return true;
        };
        let status = self.gl.get_sync_parameter(fence, Gl::SYNC_STATUS).as_f64();
        let signaled = status.is_some_and(|value| (value - f64::from(Gl::SIGNALED)).abs() < 0.5);
        if signaled {
            self.gl.delete_sync(self.fence.take().as_ref());
            self.gl.delete_buffer(self.probe.take().as_ref());
        }
        signaled
    }
}

impl Scene {
    /// Lit un pixel du tampon de dessin dans un tampon GPU (lecture asynchrone, rien n'attend) : cela
    /// force le GPU à résoudre l'anticrénelage maintenant, et non à la première composition.
    fn read_back_one_pixel(&mut self) {
        let gl = &self.gl;
        let Some(buffer) = gl.create_buffer() else {
            return;
        };
        gl.bind_buffer(Gl::PIXEL_PACK_BUFFER, Some(&buffer));
        gl.buffer_data_with_i32(Gl::PIXEL_PACK_BUFFER, PIXEL_BYTES, Gl::STREAM_READ);
        let _ = gl.read_pixels_with_i32(0, 0, 1, 1, Gl::RGBA, Gl::UNSIGNED_BYTE, 0);
        gl.bind_buffer(Gl::PIXEL_PACK_BUFFER, None);
        self.probe = Some(buffer);
    }
}
