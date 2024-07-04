import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

const LastUpdatedSelect = ({ lastUpdated,  onLastUpdatedSelect }) => {
  const [selectLastUpdate, setSelectLastUpdate] = useState(lastUpdated[0]);

  const handleChange = (value) => {
    setSelectLastUpdate(value);
    onLastUpdatedSelect(value);
  };

  return (
    <>
      <Label htmlFor="cellsize-select">Select the cell size</Label>
      <Select value={selectLastUpdate} id="cellsize-select" onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="1" />
        </SelectTrigger>
        <SelectContent>
          {lastUpdated.map((size) => (
            <SelectItem key={size} value={size}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default LastUpdatedSelect;
