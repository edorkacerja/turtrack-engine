import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Label } from "@/components/ui/label";

const CountrySelect = ({ countries, onCountrySelect }) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);

  const handleChange = (value) => {
    setSelectedCountry(value);
    onCountrySelect(value);
  };

  return (
    <>
      <Label htmlFor="country-select">Select the country</Label>
      <Select value={selectedCountry} id="country-select" onValueChange={handleChange}>
        <SelectTrigger>
          <SelectValue placeholder="US" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((country) => (
            <SelectItem key={country} value={country}>
              {country}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

export default CountrySelect;
