/* eslint-disable import/no-anonymous-default-export */

export default `\
attribute vec3 positions;
attribute vec3 instanceSourcePositions;
attribute vec3 instanceTargetPositions;
attribute vec3 instanceSourcePositions64Low;
attribute vec3 instanceTargetPositions64Low;
attribute vec4 instanceColors;
attribute float instanceWidths;

uniform float opacity;

varying vec4 vColor;

void main(void) {
  vec3 source_world = instanceSourcePositions;
  vec3 target_world = instanceTargetPositions;
  vec3 source_floor_world = instanceSourcePositions * vec3(1, 1, 0);
  vec3 target_floor_world = instanceTargetPositions * vec3(1, 1, 0);
  vec3 source_world_64low = instanceSourcePositions64Low;
  vec3 target_world_64low = instanceTargetPositions64Low;
  vec3 source_floor_world_64low = instanceSourcePositions64Low * vec3(1, 1, 0);
  vec3 target_floor_world_64low = instanceTargetPositions64Low * vec3(1, 1, 0);

  // Position
  vec4 source = project_position_to_clipspace(source_world, source_world_64low, vec3(0.));
  vec4 target = project_position_to_clipspace(target_world, target_world_64low, vec3(0.));
  vec4 source_floor = project_position_to_clipspace(source_floor_world, source_floor_world_64low, vec3(0.));
  vec4 target_floor = project_position_to_clipspace(target_floor_world, target_floor_world_64low, vec3(0.));
  
  float segmentIndex = positions.x;
  vec4 p1 = mix(source, target, segmentIndex);
  vec4 p2 = mix(source_floor, target_floor, segmentIndex);
  float heightIndex = positions.z;

  gl_Position = mix(p1, p2, heightIndex);

  // Color
  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);
}
`;
