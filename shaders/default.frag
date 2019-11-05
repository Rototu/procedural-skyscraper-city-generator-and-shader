uniform vec3 color;
uniform float light_dir;
uniform vec3 light_color;

varying vec3 world_normal;
varying float cam_dist;

void main() { 
  vec3 light_vec = vec3(10.0 * sin(light_dir), 10, 10.0 * cos(light_dir)); 
  float light = 0.5 + dot(world_normal, normalize(light_vec)) / 2.0;
  vec3 full_color = color * (light_color * light);
  float fog_intensity = smoothstep(0.0, 10000.0, cam_dist);
  vec3 fog_color = full_color * (1.0 - fog_intensity) + vec3(0.1, 0.1, 0.1) * fog_intensity;
  gl_FragColor = vec4(fog_color, 1.0);
}