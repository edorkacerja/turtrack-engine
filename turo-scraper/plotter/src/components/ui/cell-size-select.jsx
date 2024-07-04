import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

const CellSizeSelect = ({ cellSizes, onCellSizeSelect }) => {
  const [selectCellSize, setSelectCellSize] = useState(1);

  const handleChange = (value) => {
    value = Number(value);
    setSelectCellSize(value);
    onCellSizeSelect(value);
  };

  return (
    <>
      <Label htmlFor="cellsize-select">Select the cell size</Label>
      <Select value={selectCellSize} id="cellsize-select" onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="1" />
        </SelectTrigger>
        <SelectContent>
          {cellSizes.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default CellSizeSelect;
