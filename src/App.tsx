import React, {useState, useMemo} from 'react';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';
import {scaleQuantile} from 'd3-scale';
import './App.css';
import WallLayer, {NewWallLayer} from './wall-layer'


export const inFlowColors = [
  [255, 255, 204],
  [199, 233, 180],
  [127, 205, 187],
  [65, 182, 196],
  [29, 145, 192],
  [34, 94, 168],
  [12, 44, 132]
];

export const outFlowColors = [
  [255, 255, 178],
  [254, 217, 118],
  [254, 178, 76],
  [253, 141, 60],
  [252, 78, 42],
  [227, 26, 28],
  [177, 0, 38]
];

const INITIAL_VIEW_STATE = {
  longitude: -118.34921704225347,
  latitude: 33.83014929577467,
  zoom: 12,
  maxZoom: 15,
  pitch: 60,
  bearing: 0
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';

function calculateArcs(data: any, selectedCounty: any) {
  if (!data || !data.length) {
    return null;
  }
  if (!selectedCounty) {
    selectedCounty = data.find((f: any) => f.properties.name === 'Los Angeles, CA');
  }
  const {flows, centroid} = selectedCounty.properties;

  const arcs = Object.keys(flows).map(toId => {
    const f = data[toId];
    return {
      source: centroid,
      target: f.properties.centroid,
      value: flows[toId]
    };
  });

  const scale = scaleQuantile()
    .domain(arcs.map(a => Math.abs(a.value)))
    .range(inFlowColors.map((c, i) => i));

  arcs.forEach((a: any) => {
    a.gain = Math.sign(a.value);
    a.quantile = scale(Math.abs(a.value));
  });

  return arcs;
}

function getTooltip({object}: any) {
  return object && object.properties.name;
}

function App({data, strokeWidth = 1, mapStyle = MAP_STYLE}: any) {
  const [selectedCounty, selectCounty] = useState(null);

  const arcs = useMemo(() => calculateArcs(data, selectedCounty), [data, selectedCounty]);

  let arc0 = {...arcs![0]}
  arc0.source[2] = 100
  arc0.target[0] = arc0.source[0] - 0.01
  arc0.target[1] = arc0.source[1] - 0.01
  arc0.target[2] = 200

  let arc1 = {source: [...arc0.target], target: [...arc0.target]}
  arc1.target[0] = arc1.source[0] + 0.01
  arc1.target[1] = arc1.source[1] - 0.01
  arc1.source[2] = 200
  arc1.target[2] = 400
  console.log(arc1)

  const layers = [
    // new GeoJsonLayer({
    //   id: 'geojson',
    //   data,
    //   stroked: false,
    //   filled: true,
    //   getFillColor: [0, 0, 0, 0],
    //   onClick: ({object}: any) => selectCounty(object),
    //   pickable: true
    // }),
    // new WallLayer({
    //   id: 'arc',
    //   data: [arc0, arc1] as any,
    //   getSourcePosition: d => d.source,
    //   getTargetPosition: d => d.target,
    //   getColor: [255, 0, 0, 80],
    // })
    NewWallLayer('arc', [arc0.source, arc0.target, arc1.target], [255, 0, 0, 80])
  ];

  return (
    <DeckGL
      layers={layers}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
      getTooltip={getTooltip}
    >
      <Map reuseMaps mapLib={maplibregl as any} mapStyle={mapStyle}/>
    </DeckGL>
  );
}

export default App;
