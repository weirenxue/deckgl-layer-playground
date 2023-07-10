import {
  Layer,
  project32,
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

const defaultProps: DefaultProps<WallLayerProps> = {
  getSourcePosition: {type: 'accessor', value: x => x.sourcePosition},
  getTargetPosition: {type: 'accessor', value: x => x.targetPosition},
  getColor: {type: 'accessor', value: DEFAULT_COLOR},
};

/** All properties supported by WallLayer. */
export type WallLayerProps<DataT = any> = _WallLayerProps<DataT> & LayerProps;

/** Properties added by WallLayer. */
type _WallLayerProps<DataT> = {
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
export default class WallLayer<DataT = any, ExtraProps extends {} = {}> extends Layer<
  ExtraProps & Required<_WallLayerProps<DataT>>
> {
  static layerName = 'WallLayer';
  static defaultProps = defaultProps;

  getShaders() {
    return super.getShaders({vs, fs, modules: [project32]});
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



export function NewWallLayer(id: string, data: Position[], color: Color): WallLayer {
  let dataWrapper: {
    source: Position
    target: Position
    color: Color
  }[] = []

  for (let i = 0; i < data.length - 1; i++) {
    dataWrapper.push({
      source: data[i],
      target: data[i + 1],
      color: color
    })
  }
  
  return new WallLayer({
    id: id,
    data: dataWrapper,
    getSourcePosition: (d) => d.source,
    getTargetPosition: (d) => d.target,
    getColor: (d) => d.color
  })
}