"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { Locale } from "../../types";
import { getDictionary } from "../../dictionaries";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import AxisLabels from "@/app/components/ThreeJS/AxisLabels";
import { System } from "@/systems/types";
import { Systems } from "@/systems";
import { SandboxSidebar } from "@/app/components/SandboxSidebar";
import { SystemPlot } from "@/app/components/ThreeJS/System";
import { Axes } from "@/app/components/ThreeJS/Axes";

export default function Sandbox({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dictionary = getDictionary(lang);
  const [selectedSystem, setSelectedSystem] = useState<"lorenz" | "rossler">(
    "lorenz",
  );

  const [system, setSystem] = useState(Systems[0]);

  const [params, setParams] = useState(
    system.params.map(({ defaultValue }) => defaultValue),
  );

  const [init, setInit] = useState(
    system.stateVaribles.map(({ defaultValue }) => defaultValue),
  );

  const [simulationTime, setSimulationTime] = useState(200);
  const [simulationStep, setSimulationStep] = useState(0.01);

  const [error, setError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Error caught:", event.error);
      setError(event.error.message);
    };

    window.addEventListener("error", handleError);

    return () => {
      window.removeEventListener("error", handleError);
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">
            {dictionary.sandbox.errorOccurred}
          </h2>
          <p className="text-gray-700 dark:text-gray-300">{error}</p>
        </div>
      </div>
    );
  }

  const handleSystemChange = (newSystem: System) => {
    setSystem(newSystem);
    setParams(newSystem.params.map(({ defaultValue }) => defaultValue));
    setInit(newSystem.stateVaribles.map(({ defaultValue }) => defaultValue));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <SandboxSidebar
        open={sidebarOpen}
        system={system}
        params={params}
        init={init}
        simulationStep={simulationStep}
        simulationTime={simulationTime}
        onSystemChange={(newSystem) => handleSystemChange(newSystem)}
        onParamsChange={(newParams) => setParams(newParams)}
        onInitChange={(newInit) => setInit(newInit)}
        onSimulationTimeChange={(newTime) => setSimulationTime(newTime)}
        onSimulationStepChange={(newStep) => setSimulationStep(newStep)}
      />

      <div
        className="flex-grow overflow-hidden"
        style={{ marginLeft: sidebarOpen ? "320px" : "0" }}
      >
        <Button
          className="fixed bottom-4 left-4 z-40"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          variant="outline"
          size="icon"
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        <Canvas
          orthographic
          camera={{ zoom: 5, position: [100, 60, 0], up: [0, 0, 1], far: 1000 }}
          className="w-full h-full *:flex *:justify-end"
        >
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <SystemPlot
            key={system.name}
            system={system}
            init={init}
            params={params}
            time={simulationTime}
            dt={simulationStep}
          />
          <Axes size={50} />
          <AxisLabels size={50} />
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
