import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

function Drone() {
  const navigate = useNavigate();

  const videos = [
    {
      id: 1,
      title: "Drone 1: 92% predicted chance of fire.",
      src: "/videos/fire1.mp4",
      description:
        "High confidence fire observed at -28.7508,148.561. Queensland.",
    },
    {
      id: 2,
      title: "Drone 2: 89% predicted chance of fire",
      src: "/videos/nofire1.mp4",
      description:
        "High confidence fire observed at -32.80351,149.91483. New South Wales.",
    },
    {
      id: 3,
      title: "Drone 3: 95% predicted chance of fire",
      src: "/videos/fire2.mp4",
      description:
        "High confidence fire observed at -32.37176,147.08116. New South Wales",
    },
    {
      id: 4,
      title: "Drone 4: 87% predicted chance of fire",
      src: "/videos/nofire2.mp4",
      description:
        "High confidence fire observed at -34.46329,150.88165. New South Wales",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/")}
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Flame className="h-8 w-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Drone Surveillance
              </h1>
              <p className="text-sm text-gray-600">
                Live aerial monitoring and fire detection
              </p>
            </div>
          </div>
        </div>
      </div>
      

      {/* Content */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Info */}
        <div className="mt-8">
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-orange-900 flex items-center gap-2">
                <Flame className="h-6 w-6" />
                Drone Operations Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">4</div>
                  <div className="text-sm text-gray-600">Active Drones</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">All Systems Operational</div>
                  <div className="text-sm text-gray-600">Monitoring</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">36</div>
                  <div className="text-sm text-gray-600">Drones on Stand-by</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <div className="text-sm text-gray-600">Fires Detected</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="bg-white shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">
                  {video.title}
                </CardTitle>
                <p className="text-sm text-gray-600">{video.description}</p>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                  >
                    <source src={video.src} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Feed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Drone;
