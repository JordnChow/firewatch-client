import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface MapLegendProps {
  type: "dot";
  colorScale?: string[];
  valueRanges?: [number, number][];
  dotSizes?: number[];
  dotColors?: string[];
  title?: string;
}

const MapLegend = ({
  type = "choropleth",
  colorScale = [
    "#0066cc", // Blue (low density)
    "#0080ff",
    "#00ccff",
    "#ffcc00", // Yellow (medium density)
    "#ff6600",
    "#ff0000", // Red (high density)
  ],
  valueRanges = [
    [0, 10],
    [10, 20],
    [20, 30],
    [30, 40],
    [40, 50],
    [50, 60],
    [60, 70],
    [70, 80],
  ],
  dotSizes = [12, 12, 12, 12, 12, 12],
  dotColors = [
    "#0066cc",
    "#0080ff",
    "#00ccff",
    "#ffcc00",
    "#ff6600",
    "#ff0000",
  ],
  title = "Legend",
}: MapLegendProps) => {
  return (
    <Card className="w-48 md:w-56 bg-white shadow-md">
      <CardContent className="p-3">
        <h3 className="text-sm font-medium mb-2">{title}</h3>
        <div className="space-y-2">
          {dotSizes.map((size, index) => (
            <div key={index} className="flex items-center text-xs">
              <div className="w-6 h-6 mr-2 flex items-center justify-center">
                <div
                  className="rounded-full"
                  style={{
                    width: size,
                    height: size,
                    backgroundColor: dotColors[index] || "#000",
                  }}
                />
              </div>
              <span>
                {valueRanges[index]
                  ? `${valueRanges[index][0].toFixed(1)} - ${valueRanges[index][1].toFixed(1)}`
                  : `Size ${index + 1}`}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapLegend;
