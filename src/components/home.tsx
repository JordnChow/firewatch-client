import React, { useState, useEffect } from "react";
import MapContainer from "./MapContainer";
import { DataProcessor, DataPoint } from "./DataProcessor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Map, Menu, Flame } from "lucide-react";

function Home() {
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapType, setMapType] = useState<| "dot" | "heatmap">(
    "heatmap",
  );
  const [fileInputKey, setFileInputKey] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Load sample data on component mount
  useEffect(() => {
    loadSampleData();
  }, []);

  const loadSampleData = async () => {
    setLoading(true);
    setError(null);
    try {
      const sampleData = await DataProcessor.loadCSV("/hotspots20250630.csv");
      setData(sampleData);
    } catch (err) {
      setError("Failed to load sample data");
      console.error("Error loading sample data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a CSV file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const text = await file.text();
      const blob = new Blob([text], { type: "text/csv" });
      const url = URL.createObjectURL(blob);

      const csvData = await DataProcessor.loadCSV(url);

      if (csvData.length === 0) {
        setError(
          "No valid data found in CSV file. Please ensure it has columns: name, latitude, longitude, value, category",
        );
      } else {
        setData(csvData);
      }

      URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to process CSV file");
      console.error("Error processing CSV:", err);
    } finally {
      setLoading(false);
      // Reset file input
      setFileInputKey((prev) => prev + 1);
    }
  };

  return (
    <div className="w-screen h-screen bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 relative z-[200]">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/logo.png" style={{ height: 40, width: "auto" }} />
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2">
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <Button
                  onClick={() => setMapType("heatmap")}
                  variant={mapType === "heatmap" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  Heatmap
                </Button>
                <Button
                  onClick={() => setMapType("dot")}
                  variant={mapType === "dot" ? "default" : "ghost"}
                  size="sm"
                  className="text-xs"
                >
                  Dots
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onMouseEnter={() => setIsMenuOpen(true)}
              className="p-2"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
      {/* Slide-in Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[300] ${isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        onMouseLeave={() => setIsMenuOpen(false)}
      >
        <div className="flex flex-col h-full">
          {/* Menu Header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <Flame className="h-8 w-8 text-orange-600" />
              <h2 className="text-xl font-bold text-gray-900">Fire Watch</h2>
            </div>
          </div>

          {/* Menu Items */}
          <div className="flex-1 p-6">
            <nav className="space-y-6">
              <a
                href="/"
                className="block text-lg text-gray-700 hover:text-gray-900 transition-colors"
              >
                Map
              </a>
              <a
                href="./drone"
                className="block text-lg text-gray-700 hover:text-gray-900 transition-colors"
              >
                Drone Sample
              </a>

            </nav>

            {/* Mobile File Upload */}
            <div className="md:hidden mt-8 space-y-4">
              <Input
                key={fileInputKey}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="w-full"
                disabled={loading}
              />
              <Button
                onClick={loadSampleData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Load Sample"
                )}
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-red-300 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Fire Watch</h3>
            <div className="space-y-1">
              <p className="text-sm text-gray-700"><a href='https://github.com/jordnchow'>Personal Page</a></p>
              <p className="text-sm text-gray-700"><a href='https://github.com/jordnchow/firewatch'>Fire Watch</a></p>
            </div>
          </div>
        </div>
      </div>
      {/* Error Alert */}
      {error && (
        <div className="absolute top-20 left-4 right-4 z-[150]">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}
      {/* Stats Card */}
      {data.length > 0 && <></>}
      {/* Map Container - Full Screen */}
      <div className="absolute inset-0 top-16">
        {loading ? (
          <></>
        ) : (
          <MapContainer
            mapType={mapType}
            onMapTypeChange={setMapType}
          />
        )}
      </div>
    </div>
  );
}

export default Home;
