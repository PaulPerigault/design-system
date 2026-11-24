//! Compilation et liaison des shaders (GLSL ES 3.00, sources dans `shaders/*.glsl`), en deux temps :
//! émission puis lecture du résultat (voir `stages`).
use crate::fault::{Fault, GlFault};
use web_sys::{WebGl2RenderingContext as Gl, WebGlProgram, WebGlShader};

/// `COMPLETION_STATUS_KHR` (extension `KHR_parallel_shader_compile`).
const COMPLETION_STATUS: u32 = 0x91B1;
const VERTEX: &str = include_str!("shaders/vertex.glsl");
/// Surfaces du thème : support, rail, repères, fantômes, étoile, anneau.
pub const SOLID: &str = include_str!("shaders/solid.glsl");

fn issue_shader(gl: &Gl, kind: u32, source: &str) -> Result<WebGlShader, Fault> {
    let shader = gl.create_shader(kind).ok_or(GlFault::Shader)?;
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);
    Ok(shader)
}

/// Programme émis (compilation et liaison demandées, résultat pas encore lu).
pub struct Linking {
    pub program: WebGlProgram,
    shaders: [WebGlShader; 2],
}

/// Demande la compilation et la liaison du sommet partagé et d'un fragment (`SOLID`)
/// sans lire le résultat : rien ne bloque le fil principal tant que le GPU travaille.
pub fn issue(gl: &Gl, fragment_source: &str) -> Result<Linking, Fault> {
    let vertex = issue_shader(gl, Gl::VERTEX_SHADER, VERTEX)?;
    let fragment = issue_shader(gl, Gl::FRAGMENT_SHADER, fragment_source)?;
    let program = gl.create_program().ok_or(GlFault::Link)?;
    gl.attach_shader(&program, &vertex);
    gl.attach_shader(&program, &fragment);
    gl.link_program(&program);
    Ok(Linking {
        program,
        shaders: [vertex, fragment],
    })
}

fn flag(value: &wasm_bindgen::JsValue) -> bool {
    value.as_bool().unwrap_or(false)
}

/// `KHR_parallel_shader_compile` : le programme a fini de se compiler (lire le résultat ne bloque plus).
#[must_use]
pub fn is_complete(gl: &Gl, linking: &Linking) -> bool {
    flag(&gl.get_program_parameter(&linking.program, COMPLETION_STATUS))
}

/// Lit le résultat : le programme lié, ou le code de l'échec (`shader-compile` avant `program-link`).
pub fn verify(gl: &Gl, linking: Linking) -> Result<WebGlProgram, Fault> {
    let linked = flag(&gl.get_program_parameter(&linking.program, Gl::LINK_STATUS));
    let compiled = linking
        .shaders
        .iter()
        .all(|shader| flag(&gl.get_shader_parameter(shader, Gl::COMPILE_STATUS)));
    for shader in &linking.shaders {
        gl.delete_shader(Some(shader));
    }
    if linked && compiled {
        return Ok(linking.program);
    }
    gl.delete_program(Some(&linking.program));
    Err(if compiled {
        GlFault::Link
    } else {
        GlFault::Shader
    }
    .into())
}

/// Libère un programme émis qui n'a pas été vérifié (destruction en cours d'initialisation).
pub fn discard(gl: &Gl, linking: &Linking) {
    gl.delete_program(Some(&linking.program));
    for shader in &linking.shaders {
        gl.delete_shader(Some(shader));
    }
}

#[cfg(test)]
mod tests {
    use super::SOLID;

    #[test]
    fn no_shader_writes_a_literal_color() {
        assert!(!SOLID.contains("vec3(0") && !SOLID.contains("vec4(0"));
        assert!(
            !SOLID.contains('#') || SOLID.matches('#').count() == 1,
            "seul #version"
        );
    }
}
