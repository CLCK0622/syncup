import React from 'react'; // Added React import
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
  const groupedMarkers: { [key: string]: MarkerData[] } = data.reduce((acc: { [key: string]: MarkerData[] }, marker) => {
    const key = `${marker.coordinates[0]},${marker.coordinates[1]}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(marker);
    return acc;
  }, {}); // Explicitly type the initial accumulator

  const renderMarkers = () => {
    const markersToRender: React.JSX.Element[] = [];
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
          const radius = 1.5; // Increased radius for better spread of circles
          const offsetX = radius * Math.cos(angle);
          const offsetY = radius * Math.sin(angle);

          const newCoordinates: [number, number] = [
            marker.coordinates[0] + offsetX,
            marker.coordinates[1] + offsetY,
          ];

          // Calculate text Y position: original markerOffset + a vertical stack based on index
          // Each text label will be slightly lower than the previous one in the group
          const textStackOffset = index * 10; // Adjust this value for vertical spacing between text labels
          const newTextY = marker.markerOffset + textStackOffset; // Place text below the marker, stacked

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
