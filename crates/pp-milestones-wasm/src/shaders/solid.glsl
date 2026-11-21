#version 300 es
// Fragment des surfaces de la scène : couleur du thème, ombrage de Lambert (une lumière fixe plus
// l'ambiante) quand u_lit vaut 1, fondu vers le transparent avec la distance quand u_fade vaut 1.
// Sortie pré-multipliée (le canvas l'est). Aucune couleur écrite ici : tout est uniforme.
precision highp float;

uniform vec3 u_color;
uniform float u_lit;
uniform float u_fade;
uniform vec3 u_light;
uniform float u_ambient;
uniform vec2 u_fog_range;

in vec3 v_normal;
in float v_depth;

out vec4 out_color;

void main() {
  float diffuse = max(dot(normalize(v_normal), normalize(u_light)), 0.0);
  float shade = mix(1.0, u_ambient + (1.0 - u_ambient) * diffuse, u_lit);
  float fog = clamp((v_depth - u_fog_range.x) / (u_fog_range.y - u_fog_range.x), 0.0, 1.0);
  float alpha = 1.0 - fog * u_fade;
  out_color = vec4(u_color * shade * alpha, alpha);
}
