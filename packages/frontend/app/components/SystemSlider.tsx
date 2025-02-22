import { Label } from "@/components/ui";
import { Input, Slider } from "@/components/ui";
import { useState } from "react";

type Params = {
  name: string;
  value: number;
  defaultMin: number;
  defaultMax: number;
  onChange: (newValue: number) => void;
};

const cleanBorderInputValue = (value: string) => {
  let processedValue = value.toLowerCase();

  if (processedValue.at(-1) === "-" && processedValue.length > 1) {
    processedValue = processedValue.slice(0, -1);
  }

  return processedValue
    .replaceAll(/[^0-9.,\-kmкм]/gi, "")
    .replaceAll(/^(-?)[kmкм]/gi, "$1")
    .replaceAll(/,/g, ".")
    .replaceAll(/(\s|\.\.|--)/g, (substr) => substr[0]);
};

const prepareBorderInputValue = (value: string) => {
  return value.replaceAll(/[кk]/g, "000").replaceAll(/[mм]/g, "000000");
};

export const SystemSlider: React.FC<Params> = ({
  name,
  value,
  defaultMax,
  defaultMin,
  onChange,
}) => {
  const [minStr, setMinStr] = useState(defaultMin.toString());
  const [maxStr, setMaxStr] = useState(defaultMax.toString());

  const min = parseFloat(prepareBorderInputValue(minStr));
  const max = parseFloat(prepareBorderInputValue(maxStr));

  return (
    <div className="flex items-center">
      <Input
        onChange={(e) => setMinStr(cleanBorderInputValue(e.target.value))}
        value={minStr}
        className="w-12 h-8 rounded p-2"
      />
      <div className="flex flex-col w-full px-3">
        <Label className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          {name}
          {`: ${value.toFixed(2)}`}
        </Label>
        <Slider
          min={min}
          max={max}
          step={(max - min) / 100}
          value={[value]}
          onValueChange={(value) => onChange(value[0])}
        />
      </div>
      <Input
        onChange={(e) =>
          setMaxStr(cleanBorderInputValue(e.target.value.replaceAll(/,/g, ".")))
        }
        value={maxStr}
        className="w-12 h-8 rounded p-2"
      />
    </div>
  );
};
