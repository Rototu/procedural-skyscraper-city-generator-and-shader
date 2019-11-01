uniform vec3 camera_pos;

varying vec3 world_normal;
varying float cam_dist;

void main() {
  world_normal = normalize( mat3( modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz ) * normal );
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
  cam_dist = distance(position, camera_pos);
}