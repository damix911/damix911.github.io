precision highp float;

uniform mat3 u_transform;
uniform mat3 u_display;

attribute vec2 a_position;
attribute vec2 a_offset;
attribute float a_distance;
attribute float a_side;
attribute float a_color;

varying float v_distance;
varying float v_side;
varying vec3 v_color;

const float SIZE = 100.0;

void main() {
  gl_Position.xy = (u_display * (u_transform * (vec3(a_position, 1.0) + vec3(a_offset * SIZE, 0.0)))).xy;
  gl_Position.zw = vec2(0.0, 1.0);
  v_distance = a_distance;
  v_side = a_side;
  v_color = mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), a_color);
}
