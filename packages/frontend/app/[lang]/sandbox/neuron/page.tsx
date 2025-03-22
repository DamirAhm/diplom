"use client";

import { getDictionary } from "@/app/dictionaries";
import { Locale, Dictionary } from "@/app/types";
import { NeuronDynamicsChart } from "@/app/components/NeuronDynamicsChart/NeuronDynamicsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNeuronDynamicsStore } from "@/app/stores/neuronDynamicsStore";
import { ChangeEvent } from "react";

interface NeuronDynamicsPageProps {
    params: {
        lang: Locale;
    };
}

export default function NeuronDynamicsPage({ params: { lang } }: NeuronDynamicsPageProps) {
    const dict = getDictionary(lang) as Dictionary;
    const {
        modelType,
        testType,
        parameters,
        simulationData,
        setModelType,
        setTestType,
        setParameter,
        runSimulation,
    } = useNeuronDynamicsStore();

    const handleParameterChange = (param: keyof typeof parameters, value: string) => {
        setParameter(param, parseFloat(value) || 0);
    };

    return (
        <div className="container mx-auto p-4 space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>{dict.sandbox.neuronDynamics}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>{dict.sandbox.modelType}</Label>
                                <Select value={modelType} onValueChange={setModelType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="hh">{dict.sandbox.chart.models.hh}</SelectItem>
                                        <SelectItem value="fhn">{dict.sandbox.chart.models.fhn}</SelectItem>
                                        <SelectItem value="hr">{dict.sandbox.chart.models.hr}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>{dict.sandbox.testType}</Label>
                                <Select value={testType} onValueChange={setTestType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="excitability">{dict.sandbox.excitabilityClass}</SelectItem>
                                        <SelectItem value="rheobase">{dict.sandbox.rheobase}</SelectItem>
                                        <SelectItem value="threshold">{dict.sandbox.threshold}</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {modelType === "hh" && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>gNa (mS/cm²)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.gNa}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("gNa", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>gK (mS/cm²)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.gK}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("gK", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>gL (mS/cm²)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.gL}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("gL", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>ENa (mV)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.ENa}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("ENa", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>EK (mV)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.EK}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("EK", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>EL (mV)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.EL}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("EL", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cm (µF/cm²)</Label>
                                            <Input
                                                type="number"
                                                value={parameters.Cm}
                                                onChange={(e: ChangeEvent<HTMLInputElement>) => handleParameterChange("Cm", e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button onClick={runSimulation} className="w-full">
                                {dict.sandbox.runSimulation}
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <Tabs defaultValue="graph">
                                <TabsList className="w-full">
                                    <TabsTrigger value="graph">{dict.sandbox.graph}</TabsTrigger>
                                    <TabsTrigger value="parameters">{dict.sandbox.parameters}</TabsTrigger>
                                    <TabsTrigger value="analysis">{dict.sandbox.analysis}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="graph">
                                    {simulationData ? (
                                        <NeuronDynamicsChart
                                            data={simulationData}
                                            modelType={modelType}
                                            dict={dict}
                                        />
                                    ) : (
                                        <div className="h-[400px] flex items-center justify-center bg-white dark:bg-gray-800 rounded-lg">
                                            {dict.sandbox.noData}
                                        </div>
                                    )}
                                </TabsContent>
                                <TabsContent value="parameters">
                                    <Card>
                                        <CardContent className="pt-6">
                                            <pre className="whitespace-pre-wrap">
                                                {JSON.stringify(parameters, null, 2)}
                                            </pre>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="analysis">
                                    <Card>
                                        <CardContent className="pt-6">
                                            {dict.sandbox.analysisNotAvailable}
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 