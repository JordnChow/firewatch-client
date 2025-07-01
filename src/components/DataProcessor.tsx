import { csv } from "d3";

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

export interface DataPoint {
  name: string;
  latitude: number;
  longitude: number;
  value: number;
  habitat: string;
}

export class DataProcessor {
  static async loadCSV(filePath: string): Promise<DataPoint[]> {
    try {
      const data = await csv(filePath);
      return data
        .map((d) => ({
          name: d.name || "",
          latitude: parseFloat(d.latitude || "0"),
          longitude: parseFloat(d.longitude || "0"),
          value: parseFloat(d.value || "0"),
          habitat: indexToLandCover(d.LandCover) || "unknown",
        }))
        .filter((d) => !isNaN(d.latitude) && !isNaN(d.longitude));
    } catch (error) {
      console.error("Error loading CSV:", error);
      return [];
    }
  }

  static processDataForChoropleth(data: DataPoint[]): {
    [key: string]: number;
  } {
    const processed: { [key: string]: number } = {};
    data.forEach((point) => {
      if (processed[point.habitat]) {
        processed[point.habitat] += point.value;
      } else {
        processed[point.habitat] = point.value;
      }
    });
    return processed;
  }

  static getValueRanges(data: DataPoint[]): [number, number][] {
    const values = data.map((d) => d.value).sort((a, b) => a - b);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = (max - min) / 6;

    return Array.from({ length: 6 }, (_, i) => [
      Math.round(min + i * step),
      Math.round(min + (i + 1) * step),
    ]);
  }

  static getColorForValue(
    value: number,
    ranges: [number, number][],
    colors: string[],
  ): string {
    for (let i = 0; i < ranges.length; i++) {
      if (value >= ranges[i][0] && value <= ranges[i][1]) {
        return colors[i] || colors[colors.length - 1];
      }
    }
    return colors[0];
  }
}

export default DataProcessor;
