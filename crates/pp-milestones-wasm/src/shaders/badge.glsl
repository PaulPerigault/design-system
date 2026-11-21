#version 300 es
// Face du badge : la texture est écrite TELLE QUELLE. Aucun éclairage, aucun brouillard, aucune
// teinte, aucune multiplication. La texture est pré-multipliée (voir texture.rs) comme le canvas :
// le mélange (ONE, ONE_MINUS_SRC_ALPHA) rend alors les bords translucides sans altérer les pixels.
precision highp float;
precision highp sampler2D;

uniform sampler2D u_badge;

in vec2 v_uv;

out vec4 out_color;

void main() {
  out_color = texture(u_badge, v_uv);
}
