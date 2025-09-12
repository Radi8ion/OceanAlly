import requests

def reverse_geocode(latitude, longitude):
    """
    Get detailed address from GPS coordinates using OpenStreetMap Nominatim
    """
    try:
        url = f"https://nominatim.openstreetmap.org/reverse"
        params = {
            'lat': latitude,
            'lon': longitude,
            'format': 'json',
            'addressdetails': 1
        }
        
        headers = {
            'User-Agent': 'HazardReportingApp/1.0'
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if 'address' in data:
            address = data['address']
            return {
                "full_address": data.get('display_name', ''),
                "street": address.get('road', ''),
                "locality": address.get('suburb', '') or address.get('neighbourhood', ''),
                "city": address.get('city', '') or address.get('town', '') or address.get('village', ''),
                "district": address.get('district', ''),
                "state": address.get('state', ''),
                "postal_code": address.get('postcode', ''),
                "country": address.get('country', ''),
                "country_code": address.get('country_code', '')
            }
    except Exception as e:
        print(f"Reverse geocoding error: {e}")
        return {
            "error": "Unable to fetch address details",
            "coordinates_only": True
        }
    
    return None

def get_location_from_ip(ip):
    """Fallback: Get approximate location from IP"""
    try:
        url = f"http://ip-api.com/json/{ip}"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if data.get("status") == "success":
            return {
                "city": data.get("city"),
                "region": data.get("regionName"),
                "country": data.get("country"),
                "latitude": data.get("lat"),
                "longitude": data.get("lon"),
                "precision": "approximate"
            }
    except Exception as e:
        print(f"IP location error: {e}")
    
    return None