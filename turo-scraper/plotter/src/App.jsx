import Analyze from "./components/ui/analyze";
import CountrySelect from "./components/ui/country-select";
import GridMap from "./pages/GridMap";
import { useState, useEffect } from "react";
import Papa from "papaparse";
import CellSizeSelect from "./components/ui/cell-size-select";
import { useMemo } from "react";
import { generateHash } from "./utils/util";
import { useRef } from "react";

function App() {
  const [grid, setGrid] = useState([]);
  const [country, setCountry] = useState("US");
  const [selectedCellSize, setSelectedCellSize] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const prevHash = useRef(null);

  const gridData = useMemo(() => {
    const countries = new Map();
    const cellSizes = new Map();
    const lastUpdated = new Map();

    const analysis = {
      totalVehicles: 0,
      totalCells: 0,
      limitExceeded: 0,
    };

    const filtered = grid.filter((cell) => {
      countries.set(cell.country, true);
      cellSizes.set(Number(cell.base_cell_size), true);
      lastUpdated.set(cell.search_last_updated, true);
      return cell.country === country && cell.base_cell_size === selectedCellSize;
    });

    filtered.forEach((cell) => {
      const count = Number(cell.vehicle_count);
      if (count >= 200) analysis.limitExceeded++;
      analysis.totalVehicles += count;
      analysis.totalCells++;
    });

    return {
      filtered,
      analysis,
      countries: Array.from(countries.keys()),
      cellSizes: Array.from(cellSizes.keys()).sort(),
    };
  }, [grid, country, selectedCellSize]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const csv = await fetch(`/database/metadata/optimal_grid.csv`).then((res) => res.text());

        const hash = await generateHash(csv);

        if(prevHash.current === hash) return;
        prevHash.current = hash;

        const options = {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
        };

        const result = Papa.parse(csv, options);

        let grid = [];
        if (!result.errors.length) grid = result.data;

        setGrid(grid);
      } catch (error) {
        console.log("Error fetching grid data:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleCountrySelect = (country) => {
    setCountry(country);
  };

  const handleCellSizeSelect = (cellSize) => {
    setSelectedCellSize(cellSize);
  };

  return (
    <>
      <div className="fixed top-0 right-0 z-[9999] m-2 p-2 w-[220px] bg-white rounded-md shadow-md">
        <div className="flex flex-col gap-2">
          <CountrySelect countries={gridData.countries} onCountrySelect={handleCountrySelect} />
          <CellSizeSelect cellSizes={gridData.cellSizes} onCellSizeSelect={handleCellSizeSelect} />
          <hr />
          <Analyze analysis={gridData.analysis} />
        </div>
      </div>

      <GridMap grid={gridData.filtered} />
    </>
  );
}

export default App;
