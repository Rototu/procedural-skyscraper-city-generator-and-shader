varying vec2 vUv;
uniform sampler2D uTexture;

void main() {
  gl_FragColor = texture(uTexture, vUv);
}