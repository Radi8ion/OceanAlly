from sklearn.cluster import DBSCAN
import numpy as np
from collections import defaultdict

def find_hotspots(reports, eps_km=1.0, min_samples=3):
    """
    Find hazard hotspots using DBSCAN clustering
    eps_km: radius in kilometers
    """
    try:
        # Extract coordinates and metadata
        coordinates = []
        report_data = []
        
        for report in reports:
            location = report.get('location', {})
            coords = location.get('coordinates', {})
            
            if coords.get('latitude') and coords.get('longitude'):
                coordinates.append([
                    float(coords['latitude']), 
                    float(coords['longitude'])
                ])
                report_data.append({
                    'id': report.get('_id'),
                    'classification': report.get('classification', {}).get('label'),
                    'urgency': report.get('sentiment', {}).get('urgency_level'),
                    'timestamp': report.get('timestamp')
                })
        
        if len(coordinates) < min_samples:
            return []
        
        coordinates = np.array(coordinates)
        
        # Convert km to degrees (approximate)
        # 1 degree ≈ 111 km at equator
        eps_degrees = eps_km / 111.0
        
        # Perform clustering
        clustering = DBSCAN(eps=eps_degrees, min_samples=min_samples).fit(coordinates)
        
        # Group reports by clusters
        clusters = defaultdict(list)
        for idx, cluster_id in enumerate(clustering.labels_):
            if cluster_id != -1:  # -1 means noise/outlier
                clusters[cluster_id].append({
                    'coordinates': coordinates[idx],
                    'report': report_data[idx]
                })
        
        # Format hotspots
        hotspots = []
        for cluster_id, cluster_reports in clusters.items():
            # Calculate cluster center
            cluster_coords = np.array([r['coordinates'] for r in cluster_reports])
            center_lat = np.mean(cluster_coords[:, 0])
            center_lon = np.mean(cluster_coords[:, 1])
            
            # Count by urgency and classification
            urgency_counts = defaultdict(int)
            classification_counts = defaultdict(int)
            
            for cr in cluster_reports:
                urgency_counts[cr['report']['urgency']] += 1
                classification_counts[cr['report']['classification']] += 1
            
            hotspots.append({
                'cluster_id': int(cluster_id),
                'center': {
                    'latitude': center_lat,
                    'longitude': center_lon
                },
                'report_count': len(cluster_reports),
                'urgency_distribution': dict(urgency_counts),
                'classification_distribution': dict(classification_counts),
                'reports': [cr['report'] for cr in cluster_reports]
            })
        
        # Sort by report count (most active hotspots first)
        hotspots.sort(key=lambda x: x['report_count'], reverse=True)
        
        return hotspots
        
    except Exception as e:
        print(f"Clustering error: {e}")
        return []