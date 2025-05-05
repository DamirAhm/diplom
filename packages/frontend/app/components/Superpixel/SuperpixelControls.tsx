import React from "react";
import { SuperpixelParams, StrokeData } from "./types";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useDictionary } from "@/hooks/use-dictionary";
import { usePathname } from "next/navigation";

interface SuperpixelControlsProps {
  params: SuperpixelParams;
  onParamChange: (name: keyof SuperpixelParams, value: number) => void;
  onImageSelect: (file: File) => void;
  onProcess: () => void;
  isProcessing: boolean;
  strokeData: StrokeData | null;
  isImageSelected: boolean;
  drawOptions: {
    drawCenters: boolean;
    drawBorders: boolean;
    useGradientColors: boolean;
    showGradients: boolean;
    showStrokes: boolean;
  };
  setDrawOptions: React.Dispatch<
    React.SetStateAction<{
      drawCenters: boolean;
      drawBorders: boolean;
      useGradientColors: boolean;
      showGradients: boolean;
      showStrokes: boolean;
    }>
  >;
}

export const SuperpixelControls: React.FC<SuperpixelControlsProps> = ({
  params,
  onParamChange,
  onImageSelect,
  onProcess,
  isProcessing,
  strokeData,
  drawOptions,
  setDrawOptions,
  isImageSelected,
}) => {
  const dict = useDictionary();
  const pathname = usePathname();
  const isRussian = pathname?.includes("/ru/");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleParamChange =
    (name: keyof SuperpixelParams) => (value: number) => {
      onParamChange(name, value);
    };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file);
    }
  };

  const handleToggleOption = (option: keyof typeof drawOptions) => {
    setDrawOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  return (
    <div className="w-full p-4 bg-background rounded-lg border border-border">
      <div className="mb-6">
        <div className="flex items-center flex-col gap-3 space-x-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png,image/jpeg"
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="default"
            className="bg-zinc-900 w-full text-white hover:bg-zinc-700 dark:bg-zinc-800"
          >
            {dict.sandbox.superpixel.selectImage}
          </Button>
          <Button
            onClick={onProcess}
            disabled={isProcessing || !isImageSelected}
            variant={"default"}
            className="w-full"
          >
            {isProcessing
              ? dict.common.loading
              : dict.sandbox.superpixel.processImage}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.numberOfSuperpixels}</span>
            <span className="font-medium text-foreground">
              {params.numberOfSuperpixels}
            </span>
          </p>
          <Slider
            value={[params.numberOfSuperpixels]}
            min={10}
            max={4000}
            step={10}
            onValueChange={(value) =>
              handleParamChange("numberOfSuperpixels")(value[0])
            }
            className="cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.compactnessFactor}</span>
            <span className="font-medium text-foreground">
              {params.compactnessFactor}
            </span>
          </p>
          <Slider
            value={[params.compactnessFactor]}
            min={0.1}
            max={10}
            step={0.1}
            onValueChange={(value) =>
              handleParamChange("compactnessFactor")(value[0])
            }
            className="cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.elongation}</span>
            <span className="font-medium text-foreground">
              {params.elongation.toFixed(1)}
            </span>
          </p>
          <Slider
            value={[params.elongation]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={(value) => handleParamChange("elongation")(value[0])}
            className="cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.iterations}</span>
            <span className="font-medium text-foreground">
              {params.iterations}
            </span>
          </p>
          <Slider
            value={[params.iterations]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => handleParamChange("iterations")(value[0])}
            className="cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.gridSize}</span>
            <span className="font-medium text-foreground">
              {params.gridSize}
            </span>
          </p>
          <Slider
            value={[params.gridSize]}
            min={1}
            max={50}
            step={1}
            onValueChange={(value) => handleParamChange("gridSize")(value[0])}
            className="cursor-pointer"
          />
        </div>
        <div>
          <p className="text-sm mb-2 text-muted-foreground flex justify-between">
            <span>{dict.sandbox.superpixel.adaptiveFactor}</span>
            <span className="font-medium text-foreground">
              {params.adaptiveFactor.toFixed(2)}
            </span>
          </p>
          <Slider
            value={[params.adaptiveFactor]}
            min={0}
            max={1}
            step={0.01}
            onValueChange={(value) =>
              handleParamChange("adaptiveFactor")(value[0])
            }
            className="cursor-pointer"
          />
        </div>
      </div>

      {strokeData && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4 text-foreground">
            {dict.sandbox.visualization}
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="drawCenters"
                checked={drawOptions.drawCenters}
                onChange={() => handleToggleOption("drawCenters")}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="drawCenters" className="text-sm text-foreground">
                {dict.sandbox.superpixel.showCenters}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="drawBorders"
                checked={drawOptions.drawBorders}
                onChange={() => handleToggleOption("drawBorders")}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="drawBorders" className="text-sm text-foreground">
                {dict.sandbox.superpixel.showBorders}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="useGradientColors"
                checked={drawOptions.useGradientColors}
                onChange={() => handleToggleOption("useGradientColors")}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="useGradientColors"
                className="text-sm text-foreground"
              >
                {dict.sandbox.superpixel.showColorGradient}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showGradients"
                checked={drawOptions.showGradients}
                onChange={() => handleToggleOption("showGradients")}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label
                htmlFor="showGradients"
                className="text-sm text-foreground"
              >
                {dict.sandbox.superpixel.showGradients}
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showStrokes"
                checked={drawOptions.showStrokes}
                onChange={() => handleToggleOption("showStrokes")}
                className="mr-2 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="showStrokes" className="text-sm text-foreground">
                {isRussian ? "Показать мазки" : "Show strokes"}
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
