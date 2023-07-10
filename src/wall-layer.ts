import {
  Layer,
  project32,
  picking,
  LayerProps,
  LayerDataSource,
  Position,
  Accessor,
  Color,
  UpdateParameters,
  DefaultProps
} from '@deck.gl/core/typed';
import GL from '@luma.gl/constants';
import {Model, Geometry} from '@luma.gl/core';

import vs from './wall-layer-vertex.glsl';
import fs from './wall-layer-fragment.glsl';

const DEFAULT_COLOR: [number, number, number, number] = [0, 0, 0, 255];

const defaultProps: DefaultProps<LineLayerProps> = {
  getSourcePosition: {type: 'accessor', value: x => x.sourcePosition},
  getTargetPosition: {type: 'accessor', value: x => x.targetPosition},
  getColor: {type: 'accessor', value: DEFAULT_COLOR},
};

/** All properties supported by LineLayer. */
export type LineLayerProps<DataT = any> = _LineLayerProps<DataT> & LayerProps;

/** Properties added by LineLayer. */
type _LineLayerProps<DataT> = {
  data: LayerDataSource<DataT>;
  /**
   * Source position of each object.
   * @default object => object.sourcePosition
   */
  getSourcePosition?: Accessor<DataT, Position>;

  /**
   * Target position of each object.
   * @default object => object.targetPosition
   */
  getTargetPosition?: Accessor<DataT, Position>;

  /**
   * The rgba color is in the format of `[r, g, b, [a]]`.
   * @default [0, 0, 0, 255]
   */
  getColor?: Accessor<DataT, Color>;
};

/**
 * A layer that renders straight lines joining pairs of source and target coordinates.
 */
export default class LineLayer<DataT = any, ExtraProps extends {} = {}> extends Layer<
  ExtraProps & Required<_LineLayerProps<DataT>>
> {
  static layerName = 'LineLayer';
  static defaultProps = defaultProps;

  getShaders() {
    return super.getShaders({vs, fs, modules: [project32, picking]});
  }

  initializeState() {
    const attributeManager = this.getAttributeManager()!;

    attributeManager.addInstanced({
      instanceSourcePositions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getSourcePosition'
      },
      instanceTargetPositions: {
        size: 3,
        type: GL.DOUBLE,
        fp64: this.use64bitPositions(),
        transition: true,
        accessor: 'getTargetPosition'
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: GL.UNSIGNED_BYTE,
        normalized: true,
        transition: true,
        accessor: 'getColor',
        defaultValue: [0, 0, 0, 255],
      },
    });
  }

  updateState(params: UpdateParameters<this>): void {
    super.updateState(params);

    if (params.changeFlags.extensionsChanged) {
      const {gl} = this.context;
      this.state.model?.delete();
      this.state.model = this._getModel(gl);
      this.getAttributeManager()!.invalidateAll();
    }
  }

  draw({uniforms}: any): void {
    this.state.model
      .setUniforms(uniforms) // opacity
      .draw();
  }

  protected _getModel(gl: WebGLRenderingContext): Model {
    /*
     *  (0, 0, 0)-------------_(1, 0, 0)
     *       |          _,-"  |
     *       o      _,-"      o
     *       |  _,-"          |
     *   (0, 0, 1)"-------------(1, 0, 1)
     */
    const positions = [
      0, 0, 0,
      0, 0, 1,
      1, 0, 0,
      1, 0, 1
    ];

    return new Model(gl, {
      ...this.getShaders(),
      id: this.props.id,
      geometry: new Geometry({
        drawMode: GL.TRIANGLE_STRIP,
        attributes: {
          positions: new Float32Array(positions)
        }
      }),
      isInstanced: true
    });
  }
}
