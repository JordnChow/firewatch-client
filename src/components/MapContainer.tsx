import React, { useEffect, useRef, useState } from "react";
import {
  MapContainer as LeafletMapContainer,
  TileLayer,
  Marker,
  Popup,
  Rectangle,
} from "react-leaflet";
import { LatLngBounds, DivIcon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { DataPoint, DataProcessor } from "./DataProcessor";
import MapLegend from "./MapLegend";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import Papa from 'papaparse'



interface MapContainerProps {
  data?: DataPoint[];
  mapType?: "dot" | "heatmap";
  onMapTypeChange?: (type: "dot" | "heatmap") => void;
}

interface HeatmapCell {
  bounds: [[number, number], [number, number]];
  density: number;
  color: string;
}

const MapContainer = ({
  mapType = "dot",
  onMapTypeChange = () => { },
}: MapContainerProps) => {
  const [valueRanges, setValueRanges] = useState<[number, number][]>([]);
  const [heatmapValueRanges, setHeatmapValueRanges] = useState<
    [number, number][]
  >([]);
  const [colorScale] = useState([
    "#0066cc", // Blue (low density)
    "#0080ff",
    "#00ccff",
    "#ffcc00", // Yellow (medium density)
    "#ff6600",
    "#ff0000", // Red (high density)
  ]);
  const [heatmapCells, setHeatmapCells] = useState<HeatmapCell[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 6, 2),
  );
  const [calendarPosition, setCalendarPosition] = useState({ x: 16, y: 16 });
  const [legendPosition, setLegendPosition] = useState({ x: 16, y: 400 });
  const [isDraggingCalendar, setIsDraggingCalendar] = useState(false);
  const [isDraggingLegend, setIsDraggingLegend] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [data, setData] = useState([])
  const [selectedDays, setSelectedDays] = useState([new Date])

  // Australia bounds
  const australiaBounds = new LatLngBounds(
    [-44.0, 112.0], // Southwest corner
    [-10.0, 154.0], // Northeast corner
  );

  const australiaCenter: [number, number] = [-25.0, 133.0];

  function indexToLandCover(num) {
    const classes = {
      0: "Water",
      1: "Evergreen Needleleaf Forest",
      2: "Evergreen Broadleaf Forest",
      3: "Deciduous Needleleaf Forest",
      4: "Deciduous Broadleaf Forest",
      5: "Mixed Forest",
      6: "Closed Shrublands",
      7: "Open Shrublands",
      8: "Woody Savannas",
      9: "Savannas",
      10: "Grasslands",
      11: "Permanent Wetlands",
      12: "Croplands",
      13: "Urban and Built-up",
      14: "Cropland/Natural Vegetation Mosaic",
      15: "Snow and Ice",
      16: "Barren or Sparsely Vegetated",
    };
    return classes[num];
  }

  useEffect(() => {
    fetch('/data/hotspots20250702.csv')
      .then(response => {
        const contentType = response.headers.get('Content-Type');
        if (!response.ok || !contentType.includes('text/csv')) {
          throw new Error(`Fetch failed or returned HTML: ${response.status}`);
        }
        return response.text();
      })
      .then(text => {
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const cleaned = parsed.data
          .map((d) => ({
            name: d.name ?? "",
            latitude: parseFloat(d.latitude ?? "0"),
            longitude: parseFloat(d.longitude ?? "0"),
            value: parseFloat(d.value ?? "0"),
            habitat: indexToLandCover(d.LandCover) ?? "unknown",
          }))
          .filter((d) => !isNaN(d.latitude) && !isNaN(d.longitude));

        setData(cleaned);
      })
      .catch(err => alert("Error: Sample data failed"));

      setSelectedDays([new Date(2025, 6, 1), new Date(2025, 6, 2), new Date(2025, 6, 3)])
  }, [])

  useEffect(() => {
    if (data.length > 0) {
      const ranges = DataProcessor.getValueRanges(data);
      setValueRanges(ranges);

      // Generate heatmap cells when data changes
      if (mapType === "heatmap") {
        generateHeatmapCells();
      }
    }
  }, [data, mapType]);

  // Calculate heatmap-specific value ranges
  useEffect(() => {
    if (mapType === "heatmap" && heatmapCells.length > 0) {
      const densities = heatmapCells.map((cell) => cell.density);
      const minDensity = Math.min(...densities);
      const maxDensity = Math.max(...densities);
      const range = maxDensity - minDensity;
      const step = range / colorScale.length;

      const heatmapRanges: [number, number][] = colorScale.map((_, index) => [
        minDensity + index * step,
        minDensity + (index + 1) * step,
      ]);

      setHeatmapValueRanges(heatmapRanges);
    }
  }, [heatmapCells, mapType, colorScale]);

  const generateHeatmapCells = () => {
    if (data.length === 0) return;

    // Define grid parameters
    const gridSize = 0.25; // degrees (approximately 25km)
    const bounds = australiaBounds;
    const minLat = bounds.getSouth();
    const maxLat = bounds.getNorth();
    const minLng = bounds.getWest();
    const maxLng = bounds.getEast();

    const cells: HeatmapCell[] = [];
    const cellDensity: {
      [key: string]: { count: number; totalValue: number };
    } = {};

    // Calculate density for each grid cell
    for (let lat = minLat; lat < maxLat; lat += gridSize) {
      for (let lng = minLng; lng < maxLng; lng += gridSize) {
        const cellKey = `${lat.toFixed(1)}_${lng.toFixed(1)}`;
        cellDensity[cellKey] = { count: 0, totalValue: 0 };

        // Count points in this cell
        data.forEach((point) => {
          if (
            point.latitude >= lat &&
            point.latitude < lat + gridSize &&
            point.longitude >= lng &&
            point.longitude < lng + gridSize
          ) {
            cellDensity[cellKey].count++;
            cellDensity[cellKey].totalValue += point.value;
          }
        });

        // Only create cells with data
        if (cellDensity[cellKey].count > 0) {
          const density =
            cellDensity[cellKey].totalValue / cellDensity[cellKey].count;
          cells.push({
            bounds: [
              [lat, lng],
              [lat + gridSize, lng + gridSize],
            ],
            density: density,
            color: getHeatmapColor(density),
          });
        }
      }
    }

    setHeatmapCells(cells);
  };

  const getHeatmapColor = (density: number): string => {
    if (data.length === 0) return colorScale[0];

    const maxDensity = Math.max(...data.map((d) => d.value));
    const minDensity = Math.min(...data.map((d) => d.value));
    const normalized = (density - minDensity) / (maxDensity - minDensity);

    const colorIndex = Math.floor(normalized * (colorScale.length - 1));
    return colorScale[Math.min(colorIndex, colorScale.length - 1)];
  };

  const handleDateSelect = (date: Date | undefined) => {
    const checkDate = () => {
      if(!date){
        return false
      }
      for(let i = 0; i < selectedDays.length; i++){
        if(selectedDays[i].toDateString() == date.toDateString()){
          return true
        }
      }
    }
    if (date && checkDate()) {
      console.log(date)
      console.log(selectedDate)
      setSelectedDate(date);
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const day = date.getDate().toString().padStart(2, "0");
      console.log(`${year}${month}${day}`);
      fetch(`/data/hotspots${year}${month}${day}.csv`)
        .then(response => {
          const contentType = response.headers.get('Content-Type');
          if (!response.ok || !contentType.includes('text/csv')) {
            throw new Error(`Fetch failed or returned HTML: ${response.status}`);
          }
          return response.text();
        })
        .then(text => {
          const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
          const cleaned = parsed.data
            .map((d) => ({
              name: d.name ?? "",
              latitude: parseFloat(d.latitude ?? "0"),
              longitude: parseFloat(d.longitude ?? "0"),
              value: parseFloat(d.value ?? "0"),
              habitat: indexToLandCover(d.LandCover) ?? "unknown",
            }))
            .filter((d) => !isNaN(d.latitude) && !isNaN(d.longitude));

          setData(cleaned);
        })
        .catch(err => {
          alert(err)
        });
    }
  };

  const createDotIcon = (value: number, size: number) => {
    const color = getMarkerColor(value);
    return new DivIcon({
      html: `<div style="
        width: ${size * 2}px;
        height: ${size * 2}px;
        background-color: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: "custom-dot-marker",
      iconSize: [size * 2, size * 2],
      iconAnchor: [size, size],
    });
  };

  const getMarkerColor = (value: number): string => {
    return DataProcessor.getColorForValue(value, valueRanges, colorScale);
  };

  const getMarkerSize = (value: number): number => {
    if (data.length === 0) return 8;
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = Math.min(...data.map((d) => d.value));
    const normalized = (value - minValue) / (maxValue - minValue);
    return 6 + normalized * 12; // Size between 6 and 18
  };

  const handleCalendarMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.closest("button") ||
      target.closest('[role="button"]') ||
      target.closest(".rdp-nav")
    ) {
      return;
    }
    e.preventDefault();
    setIsDraggingCalendar(true);
    setDragOffset({
      x: e.clientX - calendarPosition.x,
      y: e.clientY - calendarPosition.y,
    });
  };

  const handleLegendMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLegend(true);
    setDragOffset({
      x: e.clientX - legendPosition.x,
      y: e.clientY - legendPosition.y,
    });
  };

  const constrainPosition = (
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height;

    return {
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingCalendar) {
      const newPos = constrainPosition(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
        320, // Approximate calendar width
        400, // Approximate calendar height
      );
      setCalendarPosition(newPos);
    }
    if (isDraggingLegend) {
      const newPos = constrainPosition(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y,
        224, // Approximate legend width (w-56 = 224px)
        200, // Approximate legend height
      );
      setLegendPosition(newPos);
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCalendar(false);
    setIsDraggingLegend(false);
  };

  useEffect(() => {
    if (isDraggingCalendar || isDraggingLegend) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (isDraggingCalendar) {
          const newPos = constrainPosition(
            e.clientX - dragOffset.x,
            e.clientY - dragOffset.y,
            320, // Approximate calendar width
            400, // Approximate calendar height
          );
          setCalendarPosition(newPos);
        }
        if (isDraggingLegend) {
          const newPos = constrainPosition(
            e.clientX - dragOffset.x,
            e.clientY - dragOffset.y,
            224, // Approximate legend width (w-56 = 224px)
            200, // Approximate legend height
          );
          setLegendPosition(newPos);
        }
      };

      const handleGlobalMouseUp = () => {
        setIsDraggingCalendar(false);
        setIsDraggingLegend(false);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);
      document.addEventListener("mouseup", handleGlobalMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
        document.removeEventListener("mouseup", handleGlobalMouseUp);
      };
    }
  }, [isDraggingCalendar, isDraggingLegend, dragOffset]);

  return (
    <div
      className="relative w-full h-full bg-white"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Calendar Card - Draggable */}
      <Card
        className="absolute z-[100] bg-white shadow-lg border cursor-move select-none"
        style={{
          left: `${calendarPosition.x}px`,
          top: `${calendarPosition.y}px`,
        }}
        onMouseDown={handleCalendarMouseDown}
      >
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Select Date</CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            className="rounded-md border"
            modifiers={{
              allowed: selectedDays,
            }}
            modifiersClassNames={{
              allowed:
                "bg-blue-100 text-blue-900 font-semibold hover:bg-blue-200",
            }}
            classNames={{
              nav_button:
                "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100 transition-opacity duration-200 cursor-pointer rdp-nav",
              nav_button_previous: "absolute left-1 hover:bg-accent rdp-nav",
              nav_button_next: "absolute right-1 hover:bg-accent rdp-nav",
            }}
          />
        </CardContent>
      </Card>
      {/* Map */}
      <div className="w-full h-full">
        <LeafletMapContainer
          center={australiaCenter}
          zoom={5}
          style={{ height: "100%", width: "100%", zIndex: 1 }}
          maxBounds={australiaBounds}
          maxBoundsViscosity={1.0}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* Render based on map type */}
          {mapType === "heatmap"
            ? // Render heatmap rectangles
            heatmapCells.map((cell, index) => (
              <Rectangle
                key={index}
                bounds={cell.bounds}
                pathOptions={{
                  fillColor: cell.color,
                  fillOpacity: 1,
                  color: cell.color,
                  weight: 0,
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-semibold">Heatmap Cell</h3>
                    <p>Density: {cell.density.toFixed(2)}</p>
                    <p>Color: {cell.color}</p>
                  </div>
                </Popup>
              </Rectangle>
            ))
            : // Render dot points
            data.map((point, index) => (
              <Marker
                key={index}
                position={[point.latitude, point.longitude]}
                icon={createDotIcon(point.value, getMarkerSize(point.value))}
              >
                <Popup>
                  <div className="text-sm">
                    <h3 className="font-semibold">{point.name}</h3>
                    <p>Habitat: {point.habitat}</p>
                    <p>Value: {point.value}</p>
                    <p>
                      Coordinates: {point.latitude.toFixed(4)},{" "}
                      {point.longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
        </LeafletMapContainer>
      </div>
      {/* Legend - Draggable */}
      {data.length > 0 && (
        <div
          className="absolute z-[100] cursor-move select-none"
          style={{
            left: `${legendPosition.x}px`,
            top: `${legendPosition.y}px`,
          }}
          onMouseDown={handleLegendMouseDown}
        >
          <MapLegend
            colorScale={colorScale}
            valueRanges={
              mapType === "heatmap" ? heatmapValueRanges : valueRanges
            }
            title={`${mapType === "dot" ? "Dot" : "Heatmap"} Map Legend`}
          />
        </div>
      )}
    </div>
  );
};

export default MapContainer;
