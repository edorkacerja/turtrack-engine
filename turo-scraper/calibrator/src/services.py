import geopandas as gpd
from grid import Grid
import os

def calibrator_service(country, cell_size):
    dataset_path = os.path.abspath(
        os.path.join(
            os.path.dirname( __file__ ), '..', 'dataset/naturalearth_lowres/naturalearth_lowres.shp'
        )
    )
    
    world = gpd.read_file(dataset_path)
    geolocation = world[world.name == country]
    grid = Grid(geolocation, cell_size)
    return grid.get_cells()