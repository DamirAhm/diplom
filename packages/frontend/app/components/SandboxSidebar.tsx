import { useDictionary } from "@/hooks/use-dictionary";
import { Systems } from "@/systems";
import { System } from "@/systems/types";
import { useParams } from "next/navigation";
import { Locale } from "../types";
import { SystemSlider } from "./SystemSlider";

type Props = {
  open: boolean;
  system: System;
  params: number[];
  init: number[];
  simulationTime: number;
  simulationStep: number;
  onSystemChange: (newSystem: System) => void;
  onParamsChange: (newParams: number[]) => void;
  onInitChange: (newInit: number[]) => void;
  onSimulationTimeChange: (newTime: number) => void;
  onSimulationStepChange: (newStep: number) => void;
};

export const SandboxSidebar: React.FC<Props> = ({
  open,
  system,
  params,
  init,
  simulationStep,
  simulationTime,
  onInitChange,
  onParamsChange,
  onSystemChange,
  onSimulationStepChange,
  onSimulationTimeChange,
}) => {
  const { lang } = useParams<{ lang: Locale }>();
  const dict = useDictionary();

  const handleSystemChange = (value: string) => {
    const system = Systems.find(({ name }) => name === value);

    if (system) {
      onSystemChange(system);
    }
  };

  const handleParamChange = (index: number, newValue: number) => {
    const newParams = [...params];

    newParams[index] = newValue;

    onParamsChange(newParams);
  };

  const handleInitChange = (index: number, newValue: number) => {
    const newInit = [...init];

    newInit[index] = newValue;

    onInitChange(newInit);
  };

  return (
    <div
      className={`bg-card dark:bg-secondary flex-shrink-0 border-r border-border ${open ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-20 w-64 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0`}
    >
      <div className="p-4 space-y-6">
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {dict.sandbox.systemSelection}
          </h2>
          <div className="space-y-2">
            <select
              value={system.name}
              onChange={(e) => handleSystemChange(e.target.value)}
              className="w-full p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Systems.map(({ name, label }) => (
                <option key={name} value={name}>
                  {label[lang]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {dict.sandbox.systemParameters}
          </h2>
          {system.params.map((param, i) => (
            <SystemSlider
              key={param.name}
              name={param.name}
              value={params[i]}
              defaultMin={param.min}
              defaultMax={param.max}
              onChange={(value) => handleParamChange(i, value)}
            />
          ))}
        </div>
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {dict.sandbox.initialPosition}
          </h2>
          {system.stateVaribles.map((stateVar, i) => (
            <SystemSlider
              key={stateVar.name}
              name={stateVar.name}
              value={init[i]}
              defaultMin={stateVar.min}
              defaultMax={stateVar.max}
              onChange={(value) => handleInitChange(i, value)}
            />
          ))}
        </div>
        <div className="mb-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {dict.sandbox.simulationParameters}
          </h2>
          <SystemSlider
            name={dict.sandbox.simulationTime}
            value={simulationTime}
            defaultMin={100}
            defaultMax={1000}
            onChange={(value) => onSimulationTimeChange(value)}
          />
          <SystemSlider
            name={dict.sandbox.simulationStep}
            value={Math.log10(simulationStep)}
            defaultMin={-4}
            defaultMax={-2}
            onChange={(value) => onSimulationStepChange(10 ** value)}
          />
        </div>
      </div>
    </div>
  );
};
