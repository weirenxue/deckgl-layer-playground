import React, {useState, useMemo} from 'react';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import DeckGL from '@deck.gl/react/typed';
import {GeoJsonLayer} from '@deck.gl/layers/typed';
import {scaleQuantile} from 'd3-scale';
import './App.css';
import MyLineLayer from './Layer'


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
  longitude: -100,
  latitude: 40.7,
  zoom: 3,
  maxZoom: 15,
  pitch: 30,
  bearing: 30
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
  console.log(arcs)

  const layers = [
    new GeoJsonLayer({
      id: 'geojson',
      data,
      stroked: false,
      filled: true,
      getFillColor: [0, 0, 0, 0],
      onClick: ({object}: any) => selectCounty(object),
      pickable: true
    }),
    new MyLineLayer({
      id: 'arc',
      data: arcs as any,
      getSourcePosition: d => d.source,
      getTargetPosition: d => d.target,
      getSourceColor: (d: any) => (d.gain > 0 ? inFlowColors : outFlowColors)[d.quantile] as any,
      getTargetColor: (d: any) => (d.gain > 0 ? outFlowColors : inFlowColors)[d.quantile] as any,
      getWidth: strokeWidth,
    })
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
