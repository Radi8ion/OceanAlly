// src/components/Heatmap.tsx - FIXED VERSION

import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

type HeatmapPoint = [number, number, number];

interface HeatmapProps {
  points: HeatmapPoint[];
  options?: any;
}

const Heatmap = ({ points, options = {} }: HeatmapProps) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    let heatLayer: L.Layer;

    import('leaflet.heat').then(() => {
      // 1. Get the raw intensities for debugging
      const intensities = points.map(p => p[2]);
      const minIntensity = Math.min(...intensities);
      const maxIntensity = Math.max(...intensities);
      
      console.log('Raw intensities:', intensities);
      console.log('Min intensity:', minIntensity, 'Max intensity:', maxIntensity);
      
      // 2. Better normalization with more spread
      const normalizedPoints = points.map(([lat, lng, intensity]) => {
        let normIntensity;
        if (maxIntensity > minIntensity) {
          // Normalize to 0-1 range but with better distribution
          normIntensity = (intensity - minIntensity) / (maxIntensity - minIntensity);
          // Apply power scaling to spread out the values more
          normIntensity = Math.pow(normIntensity, 0.7); // This gives more spread
        } else {
          normIntensity = 0.8; // Single value case
        }
        
        console.log(`Original: ${intensity}, Normalized: ${normIntensity}`);
        return [lat, lng, normIntensity] as HeatmapPoint;
      });

      // 3. Calculate dynamic radius based on zoom
      const zoom = map.getZoom();
      const radius = Math.max(10, 50 - (12 - zoom) * 3);

      // 4. Define options with better settings
      const heatmapOptions = {
        radius: radius,
        blur: radius * 0.6, // Reduced blur for sharper distinctions
        max: 1.0,
        minOpacity: 0.3, // Lower min opacity for better contrast
        maxZoom: 18,
        gradient: {
          0.0: '#000080',  // Dark blue
          0.2: '#0000FF',  // Blue  
          0.4: '#00FFFF',  // Cyan
          0.6: '#00FF00',  // Green
          0.8: '#FFFF00',  // Yellow
          1.0: '#FF0000'   // Red
        },
        ...options,
      };

      console.log('Creating heatmap with options:', heatmapOptions);
      // console.log('Processed points:', processedPoints);

      heatLayer = (L as any).heatLayer(normalizedPoints, heatmapOptions).addTo(map);
      
      // Update heatmap on zoom change
      const updateHeatmap = () => {
        if (heatLayer) {
          map.removeLayer(heatLayer);
          const newZoom = map.getZoom();
          const newRadius = Math.max(10, 50 - (12 - newZoom) * 3);
          const updatedOptions = {
            ...heatmapOptions,
            radius: newRadius,
            blur: newRadius * 0.6
          };
          heatLayer = (L as any).heatLayer(normalizedPoints, updatedOptions).addTo(map);
        }
      };

      map.on('zoomend', updateHeatmap);
      
      return () => {
        map.off('zoomend', updateHeatmap);
      };
    });

    return () => {
      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points, options]);

  return null;
};

export default Heatmap;