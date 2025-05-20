"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import {
  api,
  NeuronSimulationRequest,
  TimePoint as ApiTimePoint,
  SimulationResponse,
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
import { Line } from "react-chartjs-2";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Loader } from "lucide-react";

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
  x: number;
  i: number;
}

export default function Neuron({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const dict = dictionary.sandbox.neuron;

  // Neuron parameters
  const [capacitance, setCapacitanceRaw] = useState<number>(22);
  const [tuningVoltage, setTuningVoltageRaw] = useState<number>(0);
  const [modVoltage, setModVoltageRaw] = useState<number>(0);
  const [invertMemristor, setInvertMemristor] = useState<boolean>(false);

  // Diode model
  const [diodeModel, setDiodeModel] = useState<string>("GI401A");

  // Input signal
  const [signalType, setSignalType] = useState<string>("Sine");
  const [signalAmplitude, setSignalAmplitudeRaw] = useState<number>(6);
  const [signalFrequency, setSignalFrequencyRaw] = useState<number>(650);
  const [signalOffset, setSignalOffsetRaw] = useState<number>(27.5);

  // New parameters for Step signal
  const [stepTime, setStepTimeRaw] = useState<number>(10);

  // New parameters for Pulse signal
  const [pulseBaseline, setPulseBaselineRaw] = useState<number>(30);
  const [pulseStart, setPulseStartRaw] = useState<number>(0);
  const [pulseWidth, setPulseWidthRaw] = useState<number>(1.5);
  const [pulseNumber, setPulseNumberRaw] = useState<number>(50);

  // New parameters for Sine signal
  const [sinePhase, setSinePhaseRaw] = useState<number>(0);

  // New parameters for Pink Noise
  const [noiseBaseline, setNoiseBaselineRaw] = useState<number>(29.5);
  const [noiseFrequency, setNoiseFrequencyRaw] = useState<number>(1000);

  // Simulation settings
  const [simTime, setSimTimeRaw] = useState<number>(50);
  const [rkMethod, setRKMethod] = useState<string>("RK4");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  // Simulation results
  const [timeSeriesData, setTimeSeriesData] = useState<TimePoint[]>([]);

  // Create debounced versions of all setters that trigger simulation
  const debouncedRunSimulation = useDebouncedCallback(
    () => {
      runSimulation();
    },
    500
  );

  // Debounced parameter setters - UI updates immediately but simulation runs after delay
  const setCapacitance = (value: number) => {
    setCapacitanceRaw(value);
    debouncedRunSimulation();
  };

  const setTuningVoltage = (value: number) => {
    setTuningVoltageRaw(value);
    debouncedRunSimulation();
  };

  const setModVoltage = (value: number) => {
    setModVoltageRaw(value);
    debouncedRunSimulation();
  };

  const setInvertMemristorAndRun = (value: boolean) => {
    setInvertMemristor(value);
    debouncedRunSimulation();
  };

  const setSignalAmplitude = (value: number) => {
    setSignalAmplitudeRaw(value);
    debouncedRunSimulation();
  };

  const setSignalFrequency = (value: number) => {
    setSignalFrequencyRaw(value);
    debouncedRunSimulation();
  };

  const setSignalOffset = (value: number) => {
    setSignalOffsetRaw(value);
    debouncedRunSimulation();
  };

  const setSimTime = (value: number) => {
    setSimTimeRaw(value);
    debouncedRunSimulation();
  };

  const setDiodeModelAndRun = (value: string) => {
    setDiodeModel(value);
    debouncedRunSimulation();
  };

  const setSignalTypeAndRun = (value: string) => {
    switch (value) {
      case "Pulse":
        setSignalAmplitudeRaw(14.3);
        setSignalFrequencyRaw(434)
        break;
      case "PinkNoise":
        setSignalAmplitudeRaw(10);
        break;
      case "Sine":
        setSignalAmplitudeRaw(6);
        setSignalFrequencyRaw(650);
        break;
      case "Constant":
        setSignalAmplitudeRaw(21);
        break;
    }

    setSignalType(value);
    debouncedRunSimulation();
  };

  const setRKMethodAndRun = (value: string) => {
    setRKMethod(value);
    debouncedRunSimulation();
  };

  const setStepTime = (value: number) => {
    setStepTimeRaw(value);
    debouncedRunSimulation();
  };

  const setPulseBaseline = (value: number) => {
    setPulseBaselineRaw(value);
    debouncedRunSimulation();
  };

  const setPulseStart = (value: number) => {
    setPulseStartRaw(value);
    debouncedRunSimulation();
  };

  const setPulseWidth = (value: number) => {
    setPulseWidthRaw(value);
    debouncedRunSimulation();
  };

  const setPulseNumber = (value: number) => {
    setPulseNumberRaw(value);
    debouncedRunSimulation();
  };

  const setSinePhase = (value: number) => {
    setSinePhaseRaw(value);
    debouncedRunSimulation();
  };

  const setNoiseBaseline = (value: number) => {
    setNoiseBaselineRaw(value);
    debouncedRunSimulation();
  };

  const setNoiseFrequency = (value: number) => {
    setNoiseFrequencyRaw(value);
    debouncedRunSimulation();
  };

  // Reset parameters to default values except signalType
  const resetParameters = () => {
    setCapacitanceRaw(22);
    setTuningVoltageRaw(0);
    setModVoltageRaw(0);
    setInvertMemristor(false);
    setDiodeModel("GI401A");
    setSignalAmplitudeRaw(
      signalType === "Pulse" ? 14.3 :
        signalType === "PinkNoise" ? 10 :
          signalType === "Sine" ? 6 :
            signalType === "Constant" ? 21 :
              6
    );
    setSignalFrequencyRaw(
      signalType === "Pulse" ? 434 :
        signalType === "Sine" ? 650 :
          signalType === "Step" ? 650 :
            650
    );
    setSignalOffsetRaw(27.5);
    setStepTimeRaw(10);
    setPulseBaselineRaw(30);
    setPulseStartRaw(0);
    setPulseWidthRaw(1.5);
    setPulseNumberRaw(50);
    setSinePhaseRaw(0);
    setNoiseBaselineRaw(29.5);
    setNoiseFrequencyRaw(1000);
    setSimTimeRaw(50);
    setRKMethod("RK4");
    debouncedRunSimulation();
  };

  // Run simulation when component mounts
  useEffect(() => {
    runSimulation();
  }, []);

  // Run the simulation
  const runSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);

    try {
      // Prepare signal parameters based on signal type
      const signalParams: any = {};

      switch (signalType) {
        case "Constant":
          signalParams.amplitude = signalAmplitude * 1e-6; // Convert to microamps
          break;
        case "Step":
          signalParams.beforeStep = signalOffset * 1e-6;
          signalParams.afterStep = signalAmplitude * 1e-6;
          signalParams.stepTime = stepTime * 1e-3; // Convert to seconds
          break;
        case "Pulse":
          signalParams.baseline = pulseBaseline * 1e-6;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.pulseStart = pulseStart * 1e-3; // Convert to seconds
          signalParams.pulseWidth = pulseWidth * 1e-3; // Convert to seconds
          signalParams.pulsePeriod = 1 / signalFrequency;
          signalParams.pulseNumber = pulseNumber;
          break;
        case "Sine":
          signalParams.offset = signalOffset * 1e-6;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.frequency = signalFrequency;
          signalParams.phase = sinePhase * (Math.PI / 180); // Convert from degrees to radians
          break;
        case "PinkNoise":
          signalParams.baseline = noiseBaseline * 1e-6;
          signalParams.amplitude = signalAmplitude * 1e-6;
          signalParams.frequency = noiseFrequency;
          break;
      }

      // Build the request
      const request: NeuronSimulationRequest = {
        capacitance: capacitance * 1e-9, // Convert to nF
        tuningVoltage: tuningVoltage,
        modVoltage: modVoltage,
        invertMemristor: invertMemristor,
        diodeModel: diodeModel,
        signalType: signalType,
        signalParams: signalParams,
        simTime: simTime * 1e-3, // Convert to ms
        timeStep: 5e-8, // Default time step (50ns)
        rkMethod: rkMethod,
      };

      console.log("Sending request:", request);

      // Fetch time series data
      const response = await api.neuron.simulate(request);
      console.log("Received time series data:", response);

      // Convert the API response to our internal format
      const formattedData = response.data.map((point: ApiTimePoint) => ({
        t: point.t,
        v: point.v,
        x: point.x,
        i: point.i,
      }));

      setTimeSeriesData(formattedData);
    } catch (error) {
      console.error("Simulation error:", error);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper functions to prepare chart data
  const prepareVoltageChartData = (): ChartData<"line"> => {
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
          label: "Output Voltage (V)",
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
            if (point.i === undefined || point.i === null) return 0;
            return point.i * 1e6; // Convert to μA
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

  const prepareMemristorChartData = (): ChartData<"line"> => {
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
        typeof point.x === "number" &&
        !isNaN(point.t) &&
        !isNaN(point.x)
    );

    if (validData.length === 0) {
      console.warn("No valid memristor state data points found");
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
          label: "Memristor State",
          data: downsampledData.map((point) => point.x),
          borderColor: "rgba(153, 102, 255, 1)",
          backgroundColor: "rgba(153, 102, 255, 0.2)",
          tension: 0,
          pointRadius: 0,
          borderWidth: 1,
        },
      ],
    };
  };

  // Chart options
  const voltageChartOptions = useMemo(() => {
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
          point.i !== undefined && point.i !== null ? point.i * 1e6 : 0
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
    } as ChartOptions<"line">;
  }, [timeSeriesData]);

  const memristorChartOptions = useMemo(() => {
    // Calculate min/max values for better scaling if we have data
    let yMin = 0,
      yMax = 1; // Default memristor state range

    if (timeSeriesData.length > 0) {
      // Find memristor state min/max with some padding
      const states = timeSeriesData.map((point) => point.x || 0);
      const sMin = Math.min(...states);
      const sMax = Math.max(...states);
      const sPadding = (sMax - sMin) * 0.1; // 10% padding
      yMin = Math.max(0, sMin - sPadding); // Memristor state should never be below 0
      yMax = Math.min(1, sMax + sPadding); // Memristor state should never be above 1
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
              const label = context.dataset.label || "";
              const value = context.raw as number;
              return `${label}: ${value.toFixed(3)}`;
            },
          },
        },
      },
    } as ChartOptions<"line">;
  }, [timeSeriesData]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">
        {dict.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {dict.parameters.neuronParameters}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="capacitance">{dict.parameters.capacitance}</Label>
                        <span>{capacitance}</span>
                      </div>
                      <Slider
                        id="capacitance"
                        min={0.1}
                        max={200}
                        step={0.1}
                        value={[capacitance]}
                        onValueChange={(value) => setCapacitance(value[0])}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="tuningVoltage">
                          {dict.parameters.tuningVoltage}
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
                          {dict.parameters.modVoltage}
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
                        {dict.parameters.invertMemristor}
                      </Label>
                      <Switch
                        id="invertMemristor"
                        checked={invertMemristor}
                        onCheckedChange={setInvertMemristorAndRun}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">{dict.parameters.diodeModel}</h3>
                  <Select
                    value={diodeModel}
                    onValueChange={setDiodeModelAndRun}
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
                  <h3 className="text-lg font-semibold mb-3">{dict.signal.inputSignal}</h3>
                  <Select
                    value={signalType}
                    onValueChange={setSignalTypeAndRun}
                  >
                    <SelectTrigger className="mb-4">
                      <SelectValue placeholder={dict.signal.signalType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Constant">{dict.signal.constant}</SelectItem>
                      <SelectItem value="Step">{dict.signal.step}</SelectItem>
                      <SelectItem value="Pulse">{dict.signal.pulse}</SelectItem>
                      <SelectItem value="Sine">{dict.signal.sine}</SelectItem>
                      <SelectItem value="PinkNoise">{dict.signal.pinkNoise}</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-muted-foreground mb-2">
                        <Label htmlFor="signalAmplitude">
                          {dict.signal.amplitude}
                        </Label>
                        <span>{signalAmplitude}</span>
                      </div>
                      <Slider
                        id="signalAmplitude"
                        min={0}
                        max={100}
                        step={0.1}
                        value={[signalAmplitude]}
                        onValueChange={(value) =>
                          setSignalAmplitude(value[0])
                        }
                      />
                    </div>

                    {/* Step Signal Parameters */}
                    {signalType === "Step" && (
                      <>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalOffset">
                              {dict.signal.beforeStep}
                            </Label>
                            <span>{signalOffset}</span>
                          </div>
                          <Slider
                            id="signalOffset"
                            min={0}
                            max={50}
                            step={0.1}
                            value={[signalOffset]}
                            onValueChange={(value) => setSignalOffset(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="stepTime">
                              {dict.signal.stepTime}
                            </Label>
                            <span>{stepTime}</span>
                          </div>
                          <Slider
                            id="stepTime"
                            min={0}
                            max={100}
                            step={0.1}
                            value={[stepTime]}
                            onValueChange={(value) => setStepTime(value[0])}
                          />
                        </div>
                      </>
                    )}

                    {/* Pulse Signal Parameters */}
                    {signalType === "Pulse" && (
                      <>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="pulseBaseline">
                              {dict.signal.baseline}
                            </Label>
                            <span>{pulseBaseline}</span>
                          </div>
                          <Slider
                            id="pulseBaseline"
                            min={0}
                            max={50}
                            step={0.1}
                            value={[pulseBaseline]}
                            onValueChange={(value) => setPulseBaseline(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="pulseStart">
                              {dict.signal.startTime}
                            </Label>
                            <span>{pulseStart}</span>
                          </div>
                          <Slider
                            id="pulseStart"
                            min={0}
                            max={50}
                            step={0.1}
                            value={[pulseStart]}
                            onValueChange={(value) => setPulseStart(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="pulseWidth">
                              {dict.signal.pulseWidth}
                            </Label>
                            <span>{pulseWidth}</span>
                          </div>
                          <Slider
                            id="pulseWidth"
                            min={0.1}
                            max={10}
                            step={0.1}
                            value={[pulseWidth]}
                            onValueChange={(value) => setPulseWidth(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalFrequency">
                              {dict.signal.frequency}
                            </Label>
                            <span>{signalFrequency}</span>
                          </div>
                          <Slider
                            id="signalFrequency"
                            min={1}
                            max={5000}
                            step={1}
                            value={[signalFrequency]}
                            onValueChange={(value) => setSignalFrequency(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="pulseNumber">
                              {dict.signal.numberOfPulses}
                            </Label>
                            <span>{pulseNumber}</span>
                          </div>
                          <Slider
                            id="pulseNumber"
                            min={1}
                            max={50}
                            step={1}
                            value={[pulseNumber]}
                            onValueChange={(value) => setPulseNumber(value[0])}
                          />
                        </div>
                      </>
                    )}

                    {/* Sine Signal Parameters */}
                    {signalType === "Sine" && (
                      <>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalFrequency">
                              {dict.signal.frequency}
                            </Label>
                            <span>{signalFrequency}</span>
                          </div>
                          <Slider
                            id="signalFrequency"
                            min={1}
                            max={5000}
                            step={1}
                            value={[signalFrequency]}
                            onValueChange={(value) => setSignalFrequency(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="signalOffset">
                              {dict.signal.offset}
                            </Label>
                            <span>{signalOffset}</span>
                          </div>
                          <Slider
                            id="signalOffset"
                            min={0}
                            max={50}
                            step={0.1}
                            value={[signalOffset]}
                            onValueChange={(value) => setSignalOffset(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="sinePhase">
                              {dict.signal.phase}
                            </Label>
                            <span>{sinePhase}</span>
                          </div>
                          <Slider
                            id="sinePhase"
                            min={0}
                            max={360}
                            step={1}
                            value={[sinePhase]}
                            onValueChange={(value) => setSinePhase(value[0])}
                          />
                        </div>
                      </>
                    )}

                    {/* Pink Noise Signal Parameters */}
                    {signalType === "PinkNoise" && (
                      <>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="noiseBaseline">
                              {dict.signal.baseline}
                            </Label>
                            <span>{noiseBaseline}</span>
                          </div>
                          <Slider
                            id="noiseBaseline"
                            min={0}
                            max={50}
                            step={0.1}
                            value={[noiseBaseline]}
                            onValueChange={(value) => setNoiseBaseline(value[0])}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm text-muted-foreground mb-2">
                            <Label htmlFor="noiseFrequency">
                              {dict.signal.baseFrequency}
                            </Label>
                            <span>{noiseFrequency}</span>
                          </div>
                          <Slider
                            id="noiseFrequency"
                            min={1}
                            max={1000}
                            step={1}
                            value={[noiseFrequency]}
                            onValueChange={(value) => setNoiseFrequency(value[0])}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {dict.simulation.settings}
                  </h3>
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <Label htmlFor="simTime">{dict.simulation.time}</Label>
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

                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <Label htmlFor="rkMethod">{dict.simulation.rkMethod}</Label>
                    </div>
                    <Select
                      value={rkMethod}
                      onValueChange={setRKMethodAndRun}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select RK Method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RK1">{dict.simulation.rk1}</SelectItem>
                        <SelectItem value="RK2">{dict.simulation.rk2}</SelectItem>
                        <SelectItem value="RK4">{dict.simulation.rk4}</SelectItem>
                        <SelectItem value="RK8">{dict.simulation.rk8}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button
                    className="w-full"
                    variant="ghost"
                    onClick={resetParameters}
                    disabled={isSimulating}
                  >
                    {dict.resetParameters}
                  </Button>

                  <Button
                    className="w-full"
                    onClick={runSimulation}
                    disabled={isSimulating}
                  >
                    {isSimulating ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        {dict.simulation.simulating}
                      </>
                    ) : (
                      dict.simulation.run
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualization Area */}
        <div className="lg:col-span-3">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">{dict.visualization.membraneVoltage}</h3>
                  <div className="min-h-[400px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {timeSeriesData.length > 0 ? (
                      <div className="w-full h-[400px]">
                        <Line
                          data={prepareVoltageChartData()}
                          options={voltageChartOptions}
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        {dict.visualization.noData}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">{dict.visualization.memristorState}</h3>
                  <div className="min-h-[300px] flex items-center justify-center bg-muted rounded-lg border border-dashed border-border">
                    {timeSeriesData.length > 0 ? (
                      <div className="w-full h-[300px]">
                        <Line
                          data={prepareMemristorChartData()}
                          options={memristorChartOptions}
                        />
                      </div>
                    ) : (
                      <div className="text-muted-foreground">
                        {dict.visualization.noMemristorData}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
