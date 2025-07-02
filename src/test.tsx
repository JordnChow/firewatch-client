import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useState } from "react";

function MyDatePicker() {
  const [selected, setSelected] = useState<Date>();

  return (
    <DayPicker
      mode="single"
      selected={selected}
      onSelect={setSelected}
      footer={
        selected ? `Selected: ${selected.toLocaleDateString()}` : "Pick a day."
      }
    />
  );
}