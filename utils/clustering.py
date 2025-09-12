import numpy as np
from sklearn.cluster import DBSCAN
from math import radians

def find_hotspots(reports, eps_km=20, min_samples=2):
    """
    Finds geographical hotspots from a list of reports using DBSCAN clustering.
    
    Args:
        reports (list): A list of dictionaries from the Node.js service.
                        Each dict must contain 'latitude' and 'longitude' keys.
        eps_km (int): The maximum radius in kilometers to consider points a cluster.
        min_samples (int): The minimum number of reports required to form a cluster.

    Returns:
        list: A list of hotspot dictionaries formatted for the frontend.
    """
    if not reports or len(reports) < min_samples:
        return []

    # 1. Prepare coordinates for DBSCAN.
    # The 'haversine' metric requires coordinates to be in radians.
    coords_rad = []
    for report in reports:
        coords_rad.append([
            radians(report['latitude']),
            radians(report['longitude'])
        ])
    
    # 2. Convert epsilon from kilometers to radians.
    # The Earth's radius is approximately 6371 kilometers.
    epsilon_rad = eps_km / 6371.0

    # 3. Perform DBSCAN clustering using the correct metric.
    db = DBSCAN(eps=epsilon_rad, min_samples=min_samples, algorithm='ball_tree', metric='haversine').fit(np.array(coords_rad))
    
    cluster_labels = db.labels_
    
    # 4. Process the results.
    hotspots = []
    
    # Iterate through each unique cluster found (label -1 is for noise/outliers)
    unique_labels = set(cluster_labels)
    for cluster_id in unique_labels:
        if cluster_id != -1:
            # Get all the original report data for the current cluster
            cluster_reports = [reports[i] for i, label in enumerate(cluster_labels) if label == cluster_id]
            
            # Get just the coordinates for calculating the center
            cluster_coords_deg = np.array([[r['latitude'], r['longitude']] for r in cluster_reports])
            
            # Calculate the center of the hotspot by averaging coordinates
            center_lat = cluster_coords_deg[:, 0].mean()
            center_lon = cluster_coords_deg[:, 1].mean()
            
            # Get the IDs of the reports in this cluster
            report_ids = [r['_id'] for r in cluster_reports]
            
            hotspots.append({
                "center": [center_lat, center_lon],
                "report_count": len(cluster_reports),
                "report_ids": report_ids
            })
            
    return hotspots