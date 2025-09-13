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

  // Default center, e.g., Bhubaneswar, India. Change as needed.
  const mapCenter: [number, number] = [20.2961, 85.8245];

  const redOptions = { fillColor: 'red', color: 'red' };

  return (
    <MapContainer center={mapCenter} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      
      {hotspots.map((hotspot, index) => (
        <React.Fragment key={index}>
          <Marker key={index} position={hotspot.center}>
            <Popup>
              <b>Hotspot</b><br />
              Reports: {hotspot.report_count}<br />
              Location: [{hotspot.center[0].toFixed(4)}, {hotspot.center[1].toFixed(4)}]
            </Popup>
          </Marker>
          <Circle
            center={hotspot.center}
            pathOptions={{
              fillColor: '#f03',
              color: '#f03',
              fillOpacity: 0.2,
              weight: 1, // Border width
            }}
            // Radius is in meters. Base of 1km + 250m for each report.
            radius={10000 + hotspot.report_count * 4500} 
          />
        </React.Fragment>
      ))}
    </MapContainer>
  );
};

export default HotspotMap;