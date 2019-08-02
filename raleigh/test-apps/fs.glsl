precision highp float;

uniform float u_current_time;

varying float v_distance;
varying float v_side;
varying vec3 v_color;

const float PARTICLE_LENGTH = 100.0;

float rand(vec2 co) {
  return fract(sin(dot(co.xy ,vec2(12.9898, 78.233))) * 43758.5453);
}

float y(float s) {
  return 0.5 + 0.3 * sin(s);
}

float intensity(vec2 uv, float random) {
  vec2 point = vec2(0.8, y(u_current_time + PARTICLE_LENGTH * random));

  float delay = point.x - uv.x;
  float yTrail = y(u_current_time + PARTICLE_LENGTH * random - delay);

  float spotIntensity = pow(1.0 - length(point - uv), 30.0);
  float trailIntesity;

  if (uv.x > 0.8) {
    trailIntesity = 0.0;
  } else {
    trailIntesity = pow(1.0 - abs(yTrail - uv.y), 30.0) * exp(-4.0 * (1.0 - uv.x));
  }

  return spotIntensity + 0.0 * trailIntesity;
}

vec4 map(float intensity) {
  return vec4(v_color * intensity, intensity);
}

vec4 shade(vec2 uv, float random) {
  float i = intensity(uv, random);
  vec4 color = map(i);

  return color;
}

float value(float d) {
  float seed = floor((v_distance + d) / PARTICLE_LENGTH - u_current_time);
  vec2 uv = vec2(fract((v_distance + d) / PARTICLE_LENGTH - u_current_time), 1.0 - v_side);
  float i = intensity(uv, rand(vec2(seed, 4234.239432)));
  return i;
}

void main() {
  float v = value(0.0);
  gl_FragColor = map(v);
 }