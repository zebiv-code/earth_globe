// --- Shaders ---
const VS = `
attribute vec3 a_position;
attribute vec2 a_texCoord;
uniform mat4 u_matrix;
varying vec2 v_texCoord;
varying vec3 v_position;
void main() {
  gl_Position = u_matrix * vec4(a_position, 1.0);
  v_texCoord = a_texCoord;
  v_position = a_position;
}`;

const FS = `
precision mediump float;
uniform sampler2D u_dayTexture;
uniform sampler2D u_nightTexture;
uniform vec3 u_sunDirection;
varying vec2 v_texCoord;
varying vec3 v_position;
void main() {
  vec3 normal = normalize(v_position);
  float sunLight = dot(normal, normalize(u_sunDirection));
  vec4 dayColor = texture2D(u_dayTexture, v_texCoord);
  vec4 nightColor = texture2D(u_nightTexture, v_texCoord);
  float dayAmount = smoothstep(-0.2, 0.2, sunLight);
  dayColor.rgb *= 0.7 + 0.3 * max(0.0, sunLight);
  gl_FragColor = vec4(mix(nightColor.rgb, dayColor.rgb, dayAmount), 1.0);
}`;
