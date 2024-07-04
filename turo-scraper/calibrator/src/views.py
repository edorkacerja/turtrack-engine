from flask import Blueprint, request, jsonify
from services import calibrator_service

calibrator_blueprint = Blueprint('calibrator', __name__)

@calibrator_blueprint.route('/calibrate', methods=['POST'])
def calibrate():
    country_map = {
        "US": "United States of America",
        "FR": "France",
        "CA": "Canada",
        "UK": "United Kingdom",
        "AU": "Australia",
    }
    
    data = request.get_json()

    cell_size = data.get('cell_size', 1)
    country = data.get('country', 'US')

    if country.upper() == 'GB':
        country = 'UK'

    contry_name = country_map.get(country.upper(), 'United States of America')

    cells = calibrator_service(contry_name, cell_size)
    
    return jsonify(cells), 201