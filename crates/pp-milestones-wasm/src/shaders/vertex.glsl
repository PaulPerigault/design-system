#version 300 es
// Sommet partagé : position, normale et UV du monde, profondeur de vue pour le fondu.
layout(location = 0) in vec3 a_position;
layout(location = 1) in vec3 a_normal;
layout(location = 2) in vec2 a_uv;

uniform mat4 u_view_projection;
uniform mat4 u_model;

out vec3 v_normal;
out vec2 v_uv;
out float v_depth;

void main() {
  v_normal = mat3(u_model) * a_normal;
  v_uv = a_uv;
  gl_Position = u_view_projection * u_model * vec4(a_position, 1.0);
  v_depth = gl_Position.w;
}
