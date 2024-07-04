import geopandas as gpd
from shapely.geometry import box
import matplotlib.pyplot as plt
import numpy as np

class Cell:
    def __init__(self, id, cell_size, top_right_coords, bottom_left_coords):
        self.top_right_coords = top_right_coords
        self.bottom_left_coords = bottom_left_coords
        self.cell_size = cell_size
        self.temp_id = str(id)
        
    def build(self):
        return {
            'top_right_coords': self.top_right_coords,
            'bottom_left_coords': self.bottom_left_coords,
            'temp_id': self.temp_id,
            'cell_size': self.cell_size
        }

class Grid:
    def __init__(self, geolocation, cell_size):
        self.geolocation = geolocation
        self.cell_size = cell_size

        self.intersection_geometries = []
        self.cells = []

        self._generate_cell_grid()
        self._create_intersection_geometries()

    def _generate_cell_grid(self):
        bounds = self.geolocation.total_bounds
        crs = self.geolocation.crs

        minx, miny, maxx, maxy = bounds

        x_edges = np.arange(minx, maxx, self.cell_size)
        y_edges = np.arange(miny, maxy, self.cell_size)

        geometries = [box(x, y, x + self.cell_size, y + self.cell_size) for x in x_edges for y in y_edges]

        self.grid = gpd.GeoDataFrame(geometry=geometries, crs=crs)
    
    def _create_intersection_geometries(self):
        unary_union = self.geolocation.unary_union
        bounds = self.geolocation.total_bounds

        sindex = self.grid.sindex

        selected_geometries = self.grid.iloc[list(sindex.intersection(bounds))]
        final_geometries = selected_geometries[selected_geometries.intersects(unary_union)]

        self.intersection_geometries = final_geometries

        self._create_interserction_cells(final_geometries)
    
    def _create_interserction_cells(self, geometries):
        for index, cell in geometries.iterrows():
            minx, miny, maxx, maxy = cell.geometry.bounds

            top_right = {
                'lat': maxy,
                'lng': maxx
            }

            bottom_left = {
                'lat': miny,
                'lng': minx
            }
            
            cell_obj = Cell(index, self.cell_size, top_right, bottom_left)
            self.cells.append(cell_obj.build())
         

    def get_cells(self):
        cells = self.cells
        cells.sort(key=lambda x: int(x['temp_id']))
        return cells