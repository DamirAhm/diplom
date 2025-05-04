"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import {
  api,
  NeuronSimulationRequest,
  ParameterMapRequest,
  TimePoint as ApiTimePoint,
  SimulationResponse,
  ExcitabilityResponse,
  ParameterMapResponse,
} from "@/lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from "chart.js";
import { Line, Scatter } from "react-chartjs-2";
import { useDebouncedCallback } from "use-debounce";

// Fix UI component imports with proper paths
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

// Register required Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TimePoint {
  t: number;
  v: number;
  u?: number;
  I?: number;
  X?: number;
}

interface ParameterMapData {
  x: number[];
  y: number[];
  z: number[][];
  labels: {
    x: string;
    y: string;
    z: string;
  };
  classes?: number[][];
  xValues?: number[];
  yValues?: number[];
  mapType?: string;
}

export default function Neuron({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const dict = dictionary.sandbox.neuron;
  const searchParams = useSearchParams();

  // Chart refs
  const timeSeriesChartRef = useRef<HTMLCanvasElement>(null);
  const phaseSpaceChartRef = useRef<HTMLCanvasElement>(null);
  const parameterMapChartRef = useRef<HTMLCanvasElement>(null);
  const excitabilityChartRef = useRef<HTMLCanvasElement>(null);

  // Neuron parameters
  const [capacitance, setCapacitanceState] = useState<number>(22);
  const [tuningVoltage, setTuningVoltageState] = useState<number>(0.1);
  const [modVoltage, setModVoltageState] = useState<number>(0);
  const [invertMemristor, setInvertMemristor] = useState<boolean>(true);

  // Diode model
  const [diodeModel, setDiodeModel] = useState<string>("GI401A");

  // Input signal
  const [signalType, setSignalType] = useState<string>("constant");
  const [signalAmplitude, setSignalAmplitudeState] = useState<number>(66);
  const [signalFrequency, setSignalFrequencyState] = useState<number>(1000);
  const [signalOffset, setSignalOffsetState] = useState<number>(0);

  // Simulation settings
  const [simTime, setSimTimeState] = useState<number>(30);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Visualization state
  const [activeTab, setActiveTab] = useState<string>("time-series");
  const [timeSeriesData, setTimeSeriesData] = useState<TimePoint[]>([]);
  const [parameterMapData, setParameterMapData] =
    useState<ParameterMapData | null>(null);
  const [excitabilityData, setExcitabilityData] = useState<any>(null);
  const [mapType, setMapType] = useState<string>("rheobase");
  const [isParamMapLoading, setIsParamMapLoading] = useState(false);

  // Preset configurations
  const presets = {
    matlab: {
      capacitance: 200,
      tuningVoltage: 0.1,
      modVoltage: 0,
      invertMemristor: false,
      diodeModel: "GI403A",
      signalType: "constant",
      signalAmplitude: 66,
    },
    class1: {
      capacitance: 22,
      tuningVoltage: 0,
      modVoltage: 0.04,
      invertMemristor: true,
      diodeModel: "GI401A",
    },
    class2: {
      capacitance: 22,
      tuningVoltage: 0,
      modVoltage: 0.07,
      invertMemristor: true,
      diodeModel: "GI401A",
    },
    class3: {
      capacitance: 22,
      tuningVoltage: 0,
      modVoltage: 0.01,
      invertMemristor: true,
      diodeModel: "GI401A",
    },
    chaos: {
      capacitance: 22,
      tuningVoltage: 0,
      modVoltage: 0.04,
      invertMemristor: true,
      diodeModel: "GI401A",
      signalType: "sine",
      signalAmplitude: 0.5,
      signalFrequency: 1000,
      signalOffset: 21,
    },
  };

  // Apply a preset configuration
  const applyPreset = (preset: keyof typeof presets) => {
    const config = presets[preset];
    setCapacitanceState(config.capacitance);
    setTuningVoltageState(config.tuningVoltage);
    setModVoltageState(config.modVoltage);
    setInvertMemristor(config.invertMemristor);
    setDiodeModel(config.diodeModel);

    if ("signalType" in config) {
      setSignalType(config.signalType as string);
    }
    if ("signalAmplitude" in config) {
      setSignalAmplitudeState(config.signalAmplitude as number);
    }
    if ("signalFrequency" in config) {
      setSignalFrequencyState(config.signalFrequency as number);
    }
    if ("signalOffset" in config) {
      setSignalOffsetState(config.signalOffset as number);
    }
  };

  // Remove all debounced setters
  const setCapacitance = (value: number) => {
    setCapacitanceState(value);
  };

  const setTuningVoltage = (value: number) => {
    setTuningVoltageState(value);
  };

  const setModVoltage = (value: number) => {
    setModVoltageState(value);
  };

  const setSignalAmplitude = (value: number) => {
    setSignalAmplitudeState(value);
  };

  const setSignalFrequency = (value: number) => {
    setSignalFrequencyState(value);
  };

  const setSignalOffset = (value: number) => {
    setSignalOffsetState(value);
  };

  const setSimTime = (value: number) => {
    setSimTimeState(value);
  };

  // Add debounced simulation request
  const debouncedRunSimulation = useDebouncedCallback(
    async () => {
      if (isSimulating) return;
      await runSimulation();
    },
    500,
    { leading: true, trailing: true }
  );

  // Update all parameter change handlers to trigger debounced simulation
  useEffect(() => {
    debouncedRunSimulation();
  }, [
    capacitance,
    tuningVoltage,
    modVoltage,
    invertMemristor,
    diodeModel,
    signalType,
    signalAmplitude,
    signalFrequency,
    signalOffset,
    simTime,
  ]);

  // Run the simulation
  const runSimulation = async () => {
    setIsSimulating(true);

    try {
      // Prepare signal parameters based on signal type
      const signalParams: any = {};

      switch (signalType) {
        case "constant":
          signalParams.amplitude = signalAmplitude * 1e-6; // Convert to microamps
          break;
        case "step":
          signalParams.beforeStep = signalOffset * 1e-6;
          signalParams.afterStep = signalAmplitude * 1e-6;
          signalParams.stepTime = (simTime * 1e-3) / 3; // Step at 1/3 of sim time
          break;
        case "pulse":
          signalParams.baseline = 0;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.pulseStart = 0;
          signalParams.pulseWidth = 0.5e-3; // 0.5ms pulse width
          signalParams.pulsePeriod = 1 / signalFrequency;
          signalParams.pulseNumber = 10;
          break;
        case "sine":
          signalParams.offset = signalOffset * 1e-6;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.frequency = signalFrequency;
          signalParams.phase = 0;
          break;
        case "pink":
          signalParams.baseline = 0;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.frequency = 100;
          break;
        case "double_pulse":
          signalParams.baseline = 0;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.pulseStart = 0.002; // First pulse starts at 2ms
          signalParams.pulseWidth = 0.0005; // 0.5ms pulse width
          signalParams.pulsePeriod = 0.002; // 2ms between pulses in pair
          signalParams.doublePulseInterval = 0.004; // 4ms between double pulse pairs
          signalParams.numberOfPairs = 2; // Two pairs of pulses
          break;
      }

      // Build the request
      const request: NeuronSimulationRequest = {
        capacitance: capacitance * 1e-9, // Convert to nF
        tuningVoltage: tuningVoltage,
        modVoltage: modVoltage,
        invertMemristor: invertMemristor,
        diodeModel: diodeModel,
        signalType: signalType.charAt(0).toUpperCase() + signalType.slice(1), // Capitalize first letter for backend
        signalParams: signalParams,
        simTime: simTime * 1e-3, // Convert to ms
        timeStep: 5e-8, // Default time step (50ns)
      };

      console.log("Sending request:", request);

      // Fetch data based on active tab
      if (activeTab === "time-series") {
        const response = await api.neuron.simulate(request);
        console.log("Received time series data:", response);

        // Convert the API response to our internal format
        const formattedData = response.data.map((point: ApiTimePoint) => ({
          t: point.t,
          v: point.v,
          I: point.i,
          X: point.x,
        }));

        setTimeSeriesData(formattedData);
        renderTimeSeriesChart(formattedData);
      } else if (activeTab === "excitability") {
        const response = await api.neuron.excitabilityTest(request);
        console.log("Received excitability data:", response);
        setExcitabilityData(response);
        renderExcitabilityChart(response);
      } else if (activeTab === "parameter-map") {
        // Create parameter map request
        const mapRequest: ParameterMapRequest = {
          ...request,
          mapType: mapType,
          xStart: 0,
          xEnd: 0.25,
          xPoints: 20,
          yStart: mapType === "ETDvsC" ? 1e-9 : -0.15,
          yEnd: mapType === "ETDvsC" ? 100e-9 : 0.15,
          yPoints: 20,
        };

        // API call for parameter map
        const response = await api.neuron.parameterMap(mapRequest);
        console.log("Received parameter map data:", response);

        setParameterMapData({
          x: response.xValues || [],
          y: response.yValues || [],
          z: response.classes || [[]],
          labels: {
            x: "Tunnel Diode Voltage",
            y: mapType === "ETDvsC" ? "Capacitance" : "Memristor Voltage",
            z: "Excitability Class",
          },
          mapType: mapType,
          xValues: response.xValues,
          yValues: response.yValues,
          classes: response.classes,
        });
        renderParameterMapChart(response);
      }
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Placeholder rendering functions - these would use a chart library
  const renderTimeSeriesChart = (data: TimePoint[]) => {
    console.log("Rendering time series chart with data:", data);
    setTimeSeriesData(data);
  };

  const renderExcitabilityChart = (data: any) => {
    console.log("Rendering excitability chart with data:", data);
    setExcitabilityData(data);
  };

  const renderParameterMapChart = (data: any) => {
    console.log("Rendering parameter map chart with data:", data);
    setParameterMapData(data);
  };

  // Helper functions to prepare chart data
  const prepareTimeSeriesData = (): ChartData<"line"> => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    // Make sure we have valid data for plotting
    const validData = timeSeriesData.filter(
      (point) =>
        typeof point.t === "number" &&
        typeof point.v === "number" &&
        !isNaN(point.t) &&
        !isNaN(point.v)
    );

    if (validData.length === 0) {
      console.warn("No valid time series data points found");
      return {
        labels: [],
        datasets: [],
      };
    }

    // Downsample data if too many points
    const maxPoints = 1000;
    const step = Math.max(1, Math.floor(validData.length / maxPoints));
    const downsampledData = validData.filter((_, index) => index % step === 0);

    return {
      labels: downsampledData.map((point) => (point.t * 1000).toFixed(2)), // Convert to ms
      datasets: [
        {
          label: "Membrane Potential (V)",
          data: downsampledData.map((point) => point.v),
          borderColor: "rgba(75, 192, 192, 1)",
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          tension: 0,
          pointRadius: 0,
          borderWidth: 1,
        },
        {
          label: "Input Current (μA)",
          data: downsampledData.map((point) => {
            if (point.I === undefined || point.I === null) return 0;
            return point.I * 1e6; // Convert to μA
          }),
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0,
          pointRadius: 0,
          borderWidth: 1,
          yAxisID: "y1",
        },
      ],
    };
  };

  const preparePhaseSpaceData = (): ChartData<"scatter"> => {
    if (!timeSeriesData || timeSeriesData.length === 0) {
      return {
        datasets: [],
      };
    }

    // Make sure we have valid data for plotting
    const validData = timeSeriesData.filter(
      (point) =>
        typeof point.t === "number" &&
        typeof point.v === "number" &&
        typeof point.X === "number" &&
        !isNaN(point.t) &&
        !isNaN(point.v) &&
        !isNaN(point.X || 0)
    );

    if (validData.length === 0) {
      console.warn("No valid phase space data points found");
      return {
        datasets: [],
      };
    }

    return {
      datasets: [
        {
          label: "Phase Space",
          data: validData.map((point: TimePoint) => ({
            x: point.v,
            y: point.X || 0,
          })),
          backgroundColor: "rgba(75, 192, 192, 0.5)",
          borderColor: "rgba(75, 192, 192, 1)",
        },
      ],
    };
  };

  const prepareExcitabilityData = (): ChartData<"line"> => {
    if (!excitabilityData) return { datasets: [] };

    return {
      labels: excitabilityData.currents.map((c: number) =>
        (c * 1e6).toFixed(1)
      ), // Convert to μA
      datasets: [
        {
          label: "Firing Frequency (Hz)",
          data: excitabilityData.frequencies,
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          tension: 0.1,
        },
      ],
    };
  };

  const prepareParameterMapData = (): {
    data: number[][];
    xLabels: string[];
    yLabels: string[];
    mapType: string;
  } => {
    if (!parameterMapData || !parameterMapData.classes) {
      return {
        data: [[]],
        xLabels: [],
        yLabels: [],
        mapType: mapType,
      };
    }

    return {
      data: parameterMapData.classes,
      xLabels: parameterMapData.xValues?.map((x: number) => x.toFixed(2)) || [],
      yLabels:
        parameterMapData.yValues?.map((y: number) =>
          parameterMapData.mapType === "ETDvsC" ? y.toFixed(1) : y.toFixed(3)
        ) || [],
      mapType: parameterMapData.mapType || "ETDvsC",
    };
  };

  // Chart options with dynamic scaling
  const timeSeriesOptions = useMemo(() => {
    // Calculate min/max values for better scaling if we have data
    let yMin = -0.1,
      yMax = 0.3; // Default voltage range
    let y1Min = 0,
      y1Max = 100; // Default current range in μA

    if (timeSeriesData.length > 0) {
      // Find voltage min/max with some padding
      const voltages = timeSeriesData.map((point) => point.v);
      const vMin = Math.min(...voltages);
      const vMax = Math.max(...voltages);
      const vPadding = (vMax - vMin) * 0.1; // 10% padding
      yMin = vMin - vPadding;
      yMax = vMax + vPadding;

      // Find current min/max with some padding
      const currentValues = timeSeriesData
        .map((point) =>
          point.I !== undefined && point.I !== null ? point.I * 1e6 : 0
        )
        .filter((i) => !isNaN(i));
      const iMin = Math.min(...currentValues);
      const iMax = Math.max(...currentValues);
      const iPadding = (iMax - iMin) * 0.1; // 10% padding
      y1Min = iMin - iPadding;
      y1Max = iMax + iPadding;

      // Set zero as minimum for currents if they're all positive
      if (iMin >= 0 && y1Min < 0) y1Min = 0;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      elements: {
        line: {
          tension: 0,
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time (ms)",
          },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 10,
          },
        },
        y: {
          title: {
            display: true,
            text: "Voltage (V)",
          },
          min: yMin,
          max: yMax,
          ticks: {
            callback: function (value) {
              return Number(value).toFixed(2);
            },
          },
        },
        y1: {
          position: "right",
          title: {
            display: true,
            text: "Current (μA)",
          },
          min: y1Min,
          max: y1Max,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function (value) {
              return Number(value).toFixed(1);
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw as number;
              return `${label}: ${value.toFixed(3)}`;
            },
          },
        },
      },
    } as ChartOptions<"line">;
  }, [timeSeriesData]);

  const phaseSpaceOptions = useMemo(() => {
    // Calculate min/max values for better scaling if we have data
    let xMin = -0.1,
      xMax = 0.3; // Default voltage range
    let yMin = 0,
      yMax = 1; // Default memristor state range

    if (timeSeriesData.length > 0) {
      // Find voltage min/max with some padding
      const voltages = timeSeriesData.map((point) => point.v);
      const vMin = Math.min(...voltages);
      const vMax = Math.max(...voltages);
      const vPadding = (vMax - vMin) * 0.1; // 10% padding
      xMin = vMin - vPadding;
      xMax = vMax + vPadding;

      // Find memristor state min/max with some padding
      const states = timeSeriesData.map((point) => point.X || 0);
      const sMin = Math.min(...states);
      const sMax = Math.max(...states);
      const sPadding = (sMax - sMin) * 0.1; // 10% padding
      yMin = Math.max(0, sMin - sPadding); // Memristor state should never be below 0
      yMax = Math.min(1, sMax + sPadding); // Memristor state should never be above 1
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Voltage (V)",
          },
          min: xMin,
          max: xMax,
          ticks: {
            callback: function (value) {
              return Number(value).toFixed(2);
            },
          },
        },
        y: {
          title: {
            display: true,
            text: "Memristor State",
          },
          min: yMin,
          max: yMax,
          ticks: {
            callback: function (value) {
              return Number(value).toFixed(2);
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const point = context.raw as { x: number; y: number };
              return `V: ${point.x.toFixed(3)}, X: ${point.y.toFixed(3)}`;
            },
          },
        },
      },
    } as ChartOptions<"scatter">;
  }, [timeSeriesData]);

  // Add excitabilityOptions
  const excitabilityOptions = useMemo(() => {
    // Calculate min/max values for better scaling if we have data
    let yMin = 0,
      yMax = 500; // Default frequency range

    if (excitabilityData && excitabilityData.frequencies) {
      // Find frequency min/max with some padding
      const freqs = excitabilityData.frequencies;
      const fMin = Math.min(...freqs);
      const fMax = Math.max(...freqs);
      const fPadding = (fMax - fMin) * 0.1; // 10% padding
      yMin = Math.max(0, fMin - fPadding);
      yMax = fMax + fPadding;

      // Set reasonable minimum if no activity
      if (yMax < 10) yMax = 10;
    }

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: "Current (μA)",
          },
        },
        y: {
          title: {
            display: true,
            text: "Frequency (Hz)",
          },
          min: yMin,
          max: yMax,
          beginAtZero: true,
          ticks: {
            callback: function (value) {
              return Number(value).toFixed(0);
            },
          },
        },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function (context) {
              const label = context.dataset.label || "";
              const value = context.raw as number;
              return `${label}: ${value.toFixed(1)} Hz`;
            },
          },
        },
      },
    } as ChartOptions<"line">;
  }, [excitabilityData]);

  // Upload custom signal
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await api.neuron.uploadCustomSignal(file);
      console.log("Custom signal uploaded:", result);

      // Set signal type to custom
      setSignalType("custom");
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  // Эффект для загрузки данных карты параметров при активации вкладки
  useEffect(() => {
    if (activeTab === "parameter-map") {
      fetchParameterMap();
    }
  }, [activeTab, mapType]);

  // Функция для загрузки данных карты параметров
  const fetchParameterMap = async () => {
    setIsParamMapLoading(true);
    try {
      const response = await fetch(`/api/neuron/parameter-map?type=${mapType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Convert the data to match the ParameterMapData interface
      setParameterMapData({
        x: data.xValues || [],
        y: data.yValues || [],
        z: data.classes || [[]],
        labels: {
          x: "Tunnel Diode Voltage",
          y: mapType === "ETDvsC" ? "Capacitance" : "Memristor Voltage",
          z: "Excitability Class",
        },
        mapType: mapType, // Use the state variable
        xValues: data.xValues,
        yValues: data.yValues,
        classes: data.classes,
      });
    } catch (error) {
      console.error("Error fetching parameter map data:", error);
    } finally {
      setIsParamMapLoading(false);
    }
  };

  // Отдельный компонент для отображения карты параметров
  const ParameterMapRenderer = ({
    parameterMapData,
    mapType,
  }: {
    parameterMapData: any;
    mapType: string;
  }) => {
    const preparedData = prepareParameterMapData();
    console.log("Rendering parameter map with data:", preparedData);

    return (
      <div className="w-full h-[400px] p-4">
        <div className="text-center mb-4">
          Parameter Map: Excitability Classes
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <div className="w-[50px] h-[300px] relative">
            {preparedData.yLabels.map((label, idx) => (
              <div
                key={idx}
                className="absolute text-xs right-0"
                style={{
                  top: `${(idx / (preparedData.yLabels.length - 1)) * 100}%`,
                  transform: "translateY(-50%)",
                }}
              >
                {label}
              </div>
            ))}
            <div className="absolute transform -rotate-90 origin-left top-1/2 -translate-y-1/2 -left-8 text-sm">
              {preparedData.mapType === "ETDvsC"
                ? "Capacitance (nF)"
                : "E_VM (V)"}
            </div>
          </div>
          <div>
            <div className="h-[300px] bg-white relative">
              {parameterMapData.classes?.map(
                (row: number[], rowIdx: number) => (
                  <div key={rowIdx} className="flex h-[15px]">
                    {row.map((cls: number, colIdx: number) => (
                      <div
                        key={colIdx}
                        className="w-[15px] h-full"
                        style={{
                          backgroundColor:
                            cls === 1
                              ? "#4ade80"
                              : cls === 2
                              ? "#3b82f6"
                              : cls === 3
                              ? "#f43f5e"
                              : "#9ca3af",
                        }}
                      />
                    ))}
                  </div>
                )
              )}
            </div>
            <div className="flex justify-between mt-2">
              {preparedData.xLabels.map((label, idx) =>
                idx % 3 === 0 ? (
                  <div key={idx} className="text-xs">
                    {label}
                  </div>
                ) : null
              )}
            </div>
            <div className="text-center text-sm mt-2">E_TD (V)</div>
          </div>
        </div>
        <div className="flex justify-center mt-4 gap-4">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#4ade80] mr-2"></div>
            <span className="text-xs">Class 1</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#3b82f6] mr-2"></div>
            <span className="text-xs">Class 2</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-[#f43f5e] mr-2"></div>
            <span className="text-xs">Class 3</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        Tunnel Diode Neuron Visualization
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Neuron Parameters
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="capacitance">Capacitance (nF)</Label>
                        <span>{capacitance}</span>
                      </div>
                      <Slider
                        id="capacitance"
                        min={0.1}
                        max={1000}
                        step={0.1}
                        value={[capacitance]}
                        onValueChange={(value) => setCapacitance(value[0])}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="tuningVoltage">
                          Tuning Voltage (V)
                        </Label>
                        <span>{tuningVoltage}</span>
                      </div>
                      <Slider
                        id="tuningVoltage"
                        min={-0.2}
                        max={0.2}
                        step={0.01}
                        value={[tuningVoltage]}
                        onValueChange={(value) => setTuningVoltage(value[0])}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="modVoltage">
                          Modulatory Voltage (V)
                        </Label>
                        <span>{modVoltage}</span>
                      </div>
                      <Slider
                        id="modVoltage"
                        min={-0.2}
                        max={0.2}
                        step={0.01}
                        value={[modVoltage]}
                        onValueChange={(value) => setModVoltage(value[0])}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="invertMemristor"
                        className="text-sm text-muted-foreground"
                      >
                        Invert Memristor
                      </Label>
                      <Switch
                        id="invertMemristor"
                        checked={invertMemristor}
                        onCheckedChange={setInvertMemristor}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Diode Model</h3>
                  <Select
                    value={diodeModel}
                    onValueChange={(value) => setDiodeModel(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Diode Model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GI401A">GI401A</SelectItem>
                      <SelectItem value="GI403A">GI403A</SelectItem>
                      <SelectItem value="BD4">BD4</SelectItem>
                      <SelectItem value="BD5">BD5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Input Signal</h3>
                  <Select
                    value={signalType}
                    onValueChange={(value) => setSignalType(value)}
                  >
                    <SelectTrigger className="mb-4">
                      <SelectValue placeholder="Select Signal Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="constant">Constant Current</SelectItem>
                      <SelectItem value="step">Step Current</SelectItem>
                      <SelectItem value="pulse">Pulse Train</SelectItem>
                      <SelectItem value="sine">Sinusoidal</SelectItem>
                      <SelectItem value="pink">Pink Noise</SelectItem>
                      <SelectItem value="double_pulse">Double Pulse</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>

                  {signalType !== "custom" && (
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-muted-foreground mb-2">
                          <Label htmlFor="signalAmplitude">
                            Amplitude (μA)
                          </Label>
                          <span>{signalAmplitude}</span>
                        </div>
                        <Slider
                          id="signalAmplitude"
                          min={0}
                          max={10}
                          step={0.1}
                          value={[signalAmplitude]}
                          onValueChange={(value) =>
                            setSignalAmplitude(value[0])
                          }
                        />
                      </div>

                      {(signalType === "sine" || signalType === "pulse") && (
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalFrequency">
                              Frequency (Hz)
                            </Label>
                            <span>{signalFrequency}</span>
                          </div>
                          <Slider
                            id="signalFrequency"
                            min={1}
                            max={5000}
                            step={1}
                            value={[signalFrequency]}
                            onValueChange={(value) =>
                              setSignalFrequency(value[0])
                            }
                          />
                        </div>
                      )}

                      {(signalType === "sine" || signalType === "step") && (
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalOffset">
                              Offset/Initial Value (μA)
                            </Label>
                            <span>{signalOffset}</span>
                          </div>
                          <Slider
                            id="signalOffset"
                            min={0}
                            max={300}
                            step={0.1}
                            value={[signalOffset]}
                            onValueChange={(value) => setSignalOffset(value[0])}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {signalType === "custom" && (
                    <div>
                      <Label
                        htmlFor="customSignal"
                        className="text-sm text-muted-foreground mb-2 block"
                      >
                        Upload Custom Signal
                      </Label>
                      <Input
                        id="customSignal"
                        type="file"
                        accept=".wav,.csv"
                        onChange={handleFileUpload}
                        className="mb-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports WAV and CSV files
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Simulation Settings
                  </h3>
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <Label htmlFor="simTime">Simulation Time (ms)</Label>
                      <span>{simTime}</span>
                    </div>
                    <Slider
                      id="simTime"
                      min={1}
                      max={100}
                      step={1}
                      value={[simTime]}
                      onValueChange={(value) => setSimTime(value[0])}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => applyPreset("class1")}
                      size="sm"
                    >
                      Class 1 Excitability
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => applyPreset("class2")}
                      size="sm"
                    >
                      Class 2 Excitability
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => applyPreset("class3")}
                      size="sm"
                    >
                      Class 3 Excitability
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => applyPreset("chaos")}
                      size="sm"
                    >
                      Chaotic Mode
                    </Button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={debouncedRunSimulation}
                  disabled={isSimulating}
                >
                  {isSimulating ? (
                    <>
                      <svg
                        className="mr-2 h-4 w-4 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Simulating...
                    </>
                  ) : (
                    "Run Simulation"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 w-full bg-background border-b border-border">
                  <TabsTrigger
                    value="time-series"
                    className="data-[state=active]:bg-background"
                  >
                    Time Series
                  </TabsTrigger>
                  <TabsTrigger
                    value="excitability"
                    className="data-[state=active]:bg-background"
                  >
                    Excitability Test
                  </TabsTrigger>
                  <TabsTrigger
                    value="parameter-map"
                    className="data-[state=active]:bg-background"
                  >
                    Parameter Maps
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="time-series">
                  <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {timeSeriesData.length > 0 ? (
                      <div className="w-full h-[400px]">
                        <Line
                          data={prepareTimeSeriesData()}
                          options={timeSeriesOptions}
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Run a simulation to see results
                      </div>
                    )}
                  </div>
                  <div className="mt-4 min-h-[200px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {timeSeriesData.length > 0 ? (
                      <div className="w-full h-[200px]">
                        <Scatter
                          data={preparePhaseSpaceData()}
                          options={phaseSpaceOptions}
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Run a simulation to see phase space
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="excitability">
                  <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {excitabilityData ? (
                      <div className="w-full h-[400px]">
                        <Line
                          data={prepareExcitabilityData()}
                          options={excitabilityOptions}
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        Run a simulation to see excitability test results
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="parameter-map">
                  <div className="mb-4">
                    <Select
                      value={mapType}
                      onValueChange={(value) => {
                        setMapType(value);
                        // Если у нас уже есть данные и тип карты изменился,
                        // запускаем симуляцию снова для получения новой карты
                        if (parameterMapData && activeTab === "parameter-map") {
                          console.log(
                            "Changing map type and running new simulation..."
                          );
                          debouncedRunSimulation();
                        }
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Map Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ETDvsC">
                          E_TD vs Capacitance
                        </SelectItem>
                        <SelectItem value="ETDvsEVM">E_TD vs E_VM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {parameterMapData ? (
                      <ParameterMapRenderer
                        key={`map-${mapType}-${JSON.stringify(
                          parameterMapData.xValues || []
                        )}`}
                        parameterMapData={parameterMapData}
                        mapType={mapType}
                      />
                    ) : (
                      <div className="text-muted-foreground">
                        Run a parameter map simulation to see results
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              {dict.title}
            </h3>
            <p className="text-muted-foreground mb-4">{dict.description}</p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-foreground">
              {dict.practicalApplications}
            </h4>
            <p className="text-muted-foreground mb-4">
              {dict.practicalDescription}
            </p>
            <p className="text-muted-foreground mb-4">
              {dict.advancedComputing}
            </p>

            <h3 className="text-xl font-semibold mb-4 mt-6 text-foreground">
              {dict.relatedPapers}
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <a
                  href="https://www.sciencedirect.com/science/article/abs/pii/S0925231225001262"
                  className="text-primary hover:text-primary/80 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Bio-inspired neuron based on threshold selector and tunnel
                  diode capable of excitability modulation
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
