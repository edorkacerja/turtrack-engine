import React from "react";
import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import { useMemo } from "react";

function GridMap({ grid }) {
  const position = [25.91619, -96.79111060289122];

  const cells = useMemo(
    () =>
      grid.map((cell) => {
        return {
          ...cell,
          formattedCoords: [
            [cell.top_right_lat, cell.top_right_lng], // Top right
            [cell.bottom_left_lat, cell.top_right_lng], // Top left
            [cell.bottom_left_lat, cell.bottom_left_lng], // Bottom left
            [cell.top_right_lat, cell.bottom_left_lng], // Bottom right
          ],
        };
      }),
    [grid]
  );

  const getColor = (cell) => {
    let color = "black";

    const vehicles = Number(cell.vehicle_count);

    if (vehicles === 0) color = "black";
    else if (vehicles < 50) color = "green";
    else if (vehicles < 100) color = "yellow";
    else if (vehicles < 150) color = "orange";
    else if (vehicles < 200) color = "red";
    else color = "purple";

    return color;
  };

  return (
    <MapContainer
      style={{ width: "100vw", height: "100vh" }}
      center={position}
      zoom={4}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {cells.map((cell, index) => (
        <Polygon key={index} positions={cell.formattedCoords} color={getColor(cell)}>
          <Tooltip
            direction="center"
            content={`Vehicle Count: ${cell.vehicle_count}`}
          />
        </Polygon>
      ))}
    </MapContainer>
  );
}

export default GridMap;
