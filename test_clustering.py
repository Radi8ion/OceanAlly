from utils.clustering import find_hotspots

# This data simulates what your Node.js service would send
dummy_reports_from_node = [
    {'_id': 'report001', 'latitude': 18.9220, 'longitude': 72.8347},
    {'_id': 'report002', 'latitude': 18.9147, 'longitude': 72.8319},
    {'_id': 'report003', 'latitude': 19.0278, 'longitude': 72.8169},
    {'_id': 'report004', 'latitude': 13.0511, 'longitude': 80.2826},
    {'_id': 'report005', 'latitude': 13.0049, 'longitude': 80.2707},
    {'_id': 'report006', 'latitude': 13.0006, 'longitude': 80.2753},
    {'_id': 'report007', 'latitude': 15.4500, 'longitude': 73.7000}
]

# Run the clustering function with the dummy data
resulting_hotspots = find_hotspots(dummy_reports_from_node)

# Print the result
print("Hotspots found:")
print(resulting_hotspots)