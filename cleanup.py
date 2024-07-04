
import json
import os
import zipfile
import gzip

# Path to the single zip file
input_zip = './2024-05-17.zip'

# Output file name
output_file = 'combined_vehicles.json.gz'

# List to store all processed vehicles
all_vehicles = []

try:
    # Open the zip file
    with zipfile.ZipFile(input_zip, 'r') as zip_ref:
        # Iterate through all files in the zip
        for file_name in zip_ref.namelist():
            if file_name.endswith('.json'):
                try:
                    with zip_ref.open(file_name) as file:
                        data = json.load(file)
                        
                        # Process each vehicle in the 'vehicles' list
                        for vehicle in data.get('vehicles', []):
                            processed_vehicle = {
                                'completedTrips': vehicle.get('completedTrips'),
                                'hostId': vehicle.get('hostId'),
                                'id': vehicle.get('id'),
                                'resizeableUrlTemplate': vehicle.get('images', [{}])[0].get('resizeableUrlTemplate'),
                                'isAllStarHost': vehicle.get('isAllStarHost'),
                                'isNewListing': vehicle.get('isNewListing'),
                                'city': vehicle.get('location', {}).get('city'),
                                'country': vehicle.get('location', {}).get('country'),
                                'state': vehicle.get('location', {}).get('state'),
                                'homeLocationLat': vehicle.get('location', {}).get('homeLocation', {}).get('latitude'),
                                'homeLocationLong': vehicle.get('location', {}).get('homeLocation', {}).get('longitude'),
                                'locationId': vehicle.get('location', {}).get('locationId'),
                                'make': vehicle.get('make'),
                                'model': vehicle.get('model'),
                                'rating': vehicle.get('rating'),
                                'tags': vehicle.get('tags'),
                                'type': vehicle.get('type'),
                                'year': vehicle.get('year')
                            }
                            all_vehicles.append(processed_vehicle)
                except json.JSONDecodeError:
                    print(f"Error decoding JSON in file: {file_name}")
                except Exception as e:
                    print(f"Error processing file {file_name}: {str(e)}")

    # Write the combined data to a gzipped JSON file
    output_path = os.path.join(os.path.dirname(input_zip), output_file)
    with gzip.open(output_path, 'wt', encoding='UTF-8') as f:
        json.dump(all_vehicles, f)

    print(f"Processing complete. Output file: {output_path}")

except FileNotFoundError:
    print(f"Error: The file {input_zip} was not found.")
except zipfile.BadZipFile:
    print(f"Error: {input_zip} is not a valid zip file.")
except Exception as e:
    print(f"An unexpected error occurred: {str(e)}")