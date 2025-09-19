import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import React from 'react';

// Fix for default marker icon issue with webpack
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { Hotspot } from '../types';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HotspotMapProps {
  hotspots: Hotspot[];
}

const HotspotMap = ({ hotspots }: HotspotMapProps) => {
  if (!hotspots || hotspots.length === 0) {
    return <div className="text-center p-4">No hotspots to display on the map.</div>;
  }

  // Default center, e.g., Bhubaneswar, India
  const mapCenter: [number, number] = [20.2961, 85.8245];

  // Function to determine color based on report count
  const getHotspotColor = (reportCount: number) => {
    if (reportCount >= 50) {
      return {
        fillColor: '#d32f2f', // Dark red for critical hotspots
        color: '#b71c1c',
        severity: 'Critical'
      };
    } else if (reportCount >= 20) {
      return {
        fillColor: '#9c27b0', // Purple for high severity
        color: '#7b1fa2',
        severity: 'High'
      };
    } else if (reportCount >= 10) {
      return {
        fillColor: '#ff9800', // Orange for moderate severity
        color: '#f57c00',
        severity: 'Moderate'
      };
    } else {
      return {
        fillColor: '#ffc107', // Yellow for low severity
        color: '#ff8f00',
        severity: 'Low'
      };
    }
  };

  // Function to calculate circle radius based on report count
  const calculateRadius = (reportCount: number) => {
    // Base radius of 1km (1000m) + 450m for each report
    // This creates a visual representation where more reports = larger affected area
    return 1000 + (reportCount * 450);
  };

  return (
    <div>
      {/* Legend */}
      <div className="mb-4 p-3 bg-gray-100 rounded-lg">
        <h4 className="font-semibold mb-2">Hotspot Severity Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ffc107' }}></div>
            <span>Low (1-9 reports)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ff9800' }}></div>
            <span>Moderate (10-19 reports)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#9c27b0' }}></div>
            <span>High (20-49 reports)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#d32f2f' }}></div>
            <span>Critical (50+ reports)</span>
          </div>
        </div>
      </div>

      <MapContainer center={mapCenter} zoom={7} style={{ height: '400px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {hotspots.map((hotspot, index) => {
          const colorConfig = getHotspotColor(hotspot.report_count);
          const radius = calculateRadius(hotspot.report_count);
          
          return (
            <React.Fragment key={index}>
              <Marker position={hotspot.center}>
                <Popup>
                  <div>
                    <b>Hotspot #{index + 1}</b><br />
                    <strong>Severity:</strong> {colorConfig.severity}<br />
                    <strong>Reports:</strong> {hotspot.report_count}<br />
                    <strong>Affected Area:</strong> ~{(radius / 1000).toFixed(1)} km radius<br />
                    <strong>Location:</strong> [{hotspot.center[0].toFixed(4)}, {hotspot.center[1].toFixed(4)}]
                  </div>
                </Popup>
              </Marker>
              
              <Circle
                center={hotspot.center}
                pathOptions={{
                  fillColor: colorConfig.fillColor,
                  color: colorConfig.color,
                  fillOpacity: 0.3,
                  weight: 2,
                }}
                radius={radius}
              />
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default HotspotMap;