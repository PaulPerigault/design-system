//! Compilation et liaison des shaders (GLSL ES 3.00, sources dans `shaders/*.glsl`).
use crate::fault::{Fault, GlFault};
use web_sys::{WebGl2RenderingContext as Gl, WebGlProgram, WebGlShader};

const VERTEX: &str = include_str!("shaders/vertex.glsl");
const FRAGMENT: &str = include_str!("shaders/fragment.glsl");

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

/// Programme unique de la scène : un sommet, un fragment, aucune donnée interpolée dans le GLSL.
pub fn program(gl: &Gl) -> Result<WebGlProgram, Fault> {
    let vertex = compile(gl, Gl::VERTEX_SHADER, VERTEX)?;
    let fragment = compile(gl, Gl::FRAGMENT_SHADER, FRAGMENT)?;
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
