/* eslint-disable import/no-anonymous-default-export */
// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

export default `\
#define SHADER_NAME line-layer-vertex-shader

attribute vec3 positions;
attribute vec3 instanceSourcePositions;
attribute vec3 instanceTargetPositions;
attribute vec3 instanceSourcePositions64Low;
attribute vec3 instanceTargetPositions64Low;
attribute vec4 instanceColors;
attribute vec3 instancePickingColors;
attribute float instanceWidths;

uniform float opacity;
uniform float widthScale;
uniform float widthMinPixels;
uniform float widthMaxPixels;
uniform float useShortestPath;
uniform int widthUnits;

varying vec4 vColor;
varying vec2 uv;

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
  
  // linear interpolation of source & target to pick right coord
  float segmentIndex = positions.x;
  vec4 p1 = mix(source, target, segmentIndex);
  vec4 p2 = mix(source_floor, target_floor, segmentIndex);
  float heightIndex = positions.z;
  gl_Position = mix(p1, p2, heightIndex);

  // Color
  vColor = vec4(instanceColors.rgb, instanceColors.a * opacity);
  DECKGL_FILTER_COLOR(vColor, geometry);
}
`;
