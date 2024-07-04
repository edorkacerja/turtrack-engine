import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const GridInput = ({ onGridChange }) => {
  const handleChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
      const content = event.target.result;
      try {
        const jsonData = JSON.parse(content);
        onGridChange(jsonData);
      } catch (error) {
        console.error("error parsing json:", error);
        onGridChange([]);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div>
      <Label htmlFor="grid">Select a grid file</Label>
      <Input id="grid" type="file" accept=".json, application/json" onChange={handleChange} />
    </div>
  );
};

export default GridInput;
