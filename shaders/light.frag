#define USE_MAP true

varying vec2 vUv;
uniform sampler2D texture;

void main() {
  gl_FragColor = texture2D(texture, vUv);
}