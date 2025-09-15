import spacy
import json

# Test 1: Check if spaCy is working
print("=== TESTING SPACY ===")
try:
    nlp = spacy.load("en_core_web_sm")
    print("✓ spaCy loaded successfully")
    
    # Test with simple text
    test_text = "Mumbai is a city in India and Chennai is in Tamil Nadu"
    doc = nlp(test_text)
    
    print(f"\nTesting text: '{test_text}'")
    print("Entities found:")
    for ent in doc.ents:
        print(f"  - {ent.text} ({ent.label_})")
    
    # Extract only location entities
    locations = [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]
    print(f"\nLocation entities: {locations}")
    
except Exception as e:
    print(f"✗ spaCy error: {e}")

# Test 2: Check if locations file loads
print("\n=== TESTING LOCATIONS FILE ===")
try:
    with open("indian_locations.json", "r", encoding="utf-8") as f:
        locations_data = json.load(f)
    
    print("✓ Locations file loaded")
    print(f"States: {len(locations_data.get('states', []))}")
    print(f"Union Territories: {len(locations_data.get('union_territories', []))}")  
    print(f"Coastal Cities: {len(locations_data.get('coastal_cities', []))}")
    
    all_locations = set(locations_data['states'] + locations_data['union_territories'] + locations_data['coastal_cities'])
    print(f"Total locations: {len(all_locations)}")
    print(f"Sample locations: {list(all_locations)[:10]}")
    
    # Test if common cities are in the dataset
    test_cities = ["Mumbai", "Chennai", "Delhi", "Kolkata", "Bangalore", "Hyderabad"]
    print(f"\nChecking for common cities:")
    for city in test_cities:
        if city in all_locations:
            print(f"  ✓ {city} found")
        else:
            print(f"  ✗ {city} NOT found")
            
except Exception as e:
    print(f"✗ Locations file error: {e}")

# Test 3: Combined function test
print("\n=== TESTING COMBINED FUNCTION ===")
def extract_locations(text):
    doc = nlp(text)
    return [ent.text for ent in doc.ents if ent.label_ in ("GPE", "LOC")]

def get_indian_locations(text):
    locations = extract_locations(text)
    print(f"Raw locations: {locations}")
    indian_locs = [loc.strip() for loc in locations if loc.strip() in all_locations]
    print(f"Indian locations: {indian_locs}")
    return indian_locs

test_cases = [
    "Heavy floods in Mumbai and Chennai",
    "Cyclone in Odisha affecting coastal areas", 
    "Storm hits Delhi and surrounding regions",
    "Tsunami warning for Kerala and Tamil Nadu",
    "Melbourne Storm defeats Sydney in rugby",  # Should find Melbourne but not match
    "Flooding in West Bengal and Assam districts"
]

for test_case in test_cases:
    print(f"\nTesting: '{test_case}'")
    result = get_indian_locations(test_case)
    print(f"Result: {result}")
    print("-" * 40)