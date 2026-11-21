//! Compilation et liaison des shaders (GLSL ES 3.00, sources dans `shaders/*.glsl`).
use crate::fault::{Fault, GlFault};
use web_sys::{WebGl2RenderingContext as Gl, WebGlProgram, WebGlShader};

const VERTEX: &str = include_str!("shaders/vertex.glsl");
/// Surfaces du thème : support, rail, repères, fantômes, étoile, anneau.
pub const SOLID: &str = include_str!("shaders/solid.glsl");
/// Face du badge : texture seule.
pub const BADGE: &str = include_str!("shaders/badge.glsl");

fn compile(gl: &Gl, kind: u32, source: &str) -> Result<WebGlShader, Fault> {
    let shader = gl.create_shader(kind).ok_or(GlFault::Shader)?;
    gl.shader_source(&shader, source);
    gl.compile_shader(&shader);
    let compiled = gl
        .get_shader_parameter(&shader, Gl::COMPILE_STATUS)
        .as_bool()
        .unwrap_or(false);
    if compiled {
        Ok(shader)
    } else {
        gl.delete_shader(Some(&shader));
        Err(GlFault::Shader.into())
    }
}

/// Programme : le sommet partagé et un des deux fragments (`SOLID` ou `BADGE`).
pub fn program(gl: &Gl, fragment_source: &str) -> Result<WebGlProgram, Fault> {
    let vertex = compile(gl, Gl::VERTEX_SHADER, VERTEX)?;
    let fragment = compile(gl, Gl::FRAGMENT_SHADER, fragment_source)?;
    let program = gl.create_program().ok_or(GlFault::Link)?;
    gl.attach_shader(&program, &vertex);
    gl.attach_shader(&program, &fragment);
    gl.link_program(&program);
    // Les shaders ne servent plus une fois liés.
    gl.delete_shader(Some(&vertex));
    gl.delete_shader(Some(&fragment));
    let linked = gl
        .get_program_parameter(&program, Gl::LINK_STATUS)
        .as_bool()
        .unwrap_or(false);
    if linked {
        Ok(program)
    } else {
        gl.delete_program(Some(&program));
        Err(GlFault::Link.into())
    }
}

#[cfg(test)]
mod tests {
    use super::{BADGE, SOLID};

    /// Règle d'usage des badges (ADR-0013) : la face les écrit tels quels, sans rien d'autre.
    #[test]
    fn the_badge_fragment_only_samples_the_texture() {
        let code: Vec<&str> = BADGE
            .lines()
            .filter(|l| !l.trim_start().starts_with("//"))
            .collect();
        let body = code.join("\n");
        assert_eq!(body.matches("texture(").count(), 1);
        assert!(body.contains("out_color = texture(u_badge, v_uv);"));
        for forbidden in [
            "u_color",
            "u_light",
            "u_fog",
            "u_ambient",
            "u_lit",
            "mix(",
            "dot(",
            " * ",
        ] {
            assert!(!body.contains(forbidden), "{forbidden}");
        }
    }

    #[test]
    fn no_shader_writes_a_literal_color() {
        for source in [SOLID, BADGE] {
            assert!(!source.contains("vec3(0") && !source.contains("vec4(0"));
            assert!(
                !source.contains('#') || source.matches('#').count() == 1,
                "seul #version"
            );
        }
    }
}
