"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

const geoUrl =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface MarkerData {
  name: string;
  coordinates: [number, number];
  markerOffset: number;
}

interface MapProps {
  data: MarkerData[];
}

export default function Map({ data }: MapProps) {
  // Group markers by coordinates to identify overlaps
  const groupedMarkers: { [key: string]: MarkerData[] } = data.reduce((acc, marker) => {
    const key = `${marker.coordinates[0]},${marker.coordinates[1]}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(marker);
    return acc;
  }, {});

  const renderMarkers = () => {
    const markersToRender: JSX.Element[] = [];
    Object.values(groupedMarkers).forEach(group => {
      if (group.length === 1) {
        // Single marker at this location
        const { name, coordinates, markerOffset } = group[0];
        markersToRender.push(
          <Marker key={`${name}-${coordinates[0]}-${coordinates[1]}`} coordinates={coordinates}>
            <circle r={5} fill="#FF5533" stroke="#fff" strokeWidth={1} />
            <text
              textAnchor="middle"
              y={markerOffset}
              style={{ fontFamily: "system-ui", fill: "#5D5A6D", fontSize: "10px" }}
            >
              {name}
            </text>
          </Marker>
        );
      } else {
        // Multiple markers at this location, apply a more distinct offset for both circle and text
        group.forEach((marker, index) => {
          const angle = (index / group.length) * 2 * Math.PI; // Distribute markers in a circle
          const radius = 0.5; // Adjust radius for spread of circles
          const offsetX = radius * Math.cos(angle);
          const offsetY = radius * Math.sin(angle);

          const newCoordinates: [number, number] = [
            marker.coordinates[0] + offsetX,
            marker.coordinates[1] + offsetY,
          ];

          // Adjust text Y position based on the circle's offsetY and original markerOffset
          const newTextY = marker.markerOffset + (offsetY * 10); // Scale offsetY for text separation

          markersToRender.push(
            <Marker key={`${marker.name}-${newCoordinates[0]}-${newCoordinates[1]}`} coordinates={newCoordinates}>
              <circle r={5} fill="#FF5533" stroke="#fff" strokeWidth={1} />
              <text
                textAnchor="middle"
                y={newTextY}
                style={{ fontFamily: "system-ui", fill: "#5D5A6D", fontSize: "10px" }}
              >
                {marker.name}
              </text>
            </Marker>
          );
        });
      }
    });
    return markersToRender;
  };

  return (
    <ComposableMap projection="geoEqualEarth" projectionConfig={{ scale: 150 }}>
      <ZoomableGroup center={[0, 0]} zoom={1}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography key={geo.rsmKey} geography={geo} fill="#EAEAEC" stroke="#D6D6DA" />
            ))
          }
        </Geographies>
        {renderMarkers()}
      </ZoomableGroup>
    </ComposableMap>
  );
}
