#version 300 es
// Fragment : couleur du thème, ombrage de Lambert (une lumière fixe plus l'ambiante) quand
// u_lit vaut 1, brouillard vers la couleur de fond. Aucune couleur écrite ici : tout est uniforme.
precision highp float;

uniform vec3 u_color;
uniform float u_lit;
uniform vec3 u_light;
uniform float u_ambient;
uniform vec3 u_fog_color;
uniform vec2 u_fog_range;

in vec3 v_normal;
in float v_depth;

out vec4 out_color;

void main() {
  float diffuse = max(dot(normalize(v_normal), normalize(u_light)), 0.0);
  float shade = mix(1.0, u_ambient + (1.0 - u_ambient) * diffuse, u_lit);
  float fog = clamp((v_depth - u_fog_range.x) / (u_fog_range.y - u_fog_range.x), 0.0, 1.0);
  out_color = vec4(mix(u_color * shade, u_fog_color, fog), 1.0);
}
