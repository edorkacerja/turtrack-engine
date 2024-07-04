const Analyze = ({ analysis }) => {
  return (
    <div>
      <p className="text-xs">Total Vehicles: {analysis.totalVehicles}</p>
      <p className="text-xs">Total cells: {analysis.totalCells}</p>
      <p className="text-xs">200+ locations: {analysis.limitExceeded}</p>
    </div>
  );
};

export default Analyze;
