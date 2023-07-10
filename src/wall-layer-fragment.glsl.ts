/* eslint-disable import/no-anonymous-default-export */

export default `\
precision highp float;

varying vec4 vColor;

void main(void) {
  gl_FragColor = vColor;
}
`;
