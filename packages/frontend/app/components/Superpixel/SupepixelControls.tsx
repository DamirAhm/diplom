"use client";

import React from "react";
import { Locale } from "@/app/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ArrowRight } from "lucide-react";
import { SuperpixelParams } from "./types";

interface SuperpixelControlsProps {
    dict: any;
    params: SuperpixelParams;
    handleParamChange: (paramName: keyof SuperpixelParams, value: number) => void;
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    processImage: () => void;
    loading: boolean;
    imageFile: File | null;
    strokeData: any;
    showGradients: boolean;
    setShowGradients: (value: boolean) => void;
    showCenters: boolean;
    setShowCenters: (value: boolean) => void;
    showColorGradient: boolean;
    setShowColorGradient: (value: boolean) => void;
    gradientSensitivity: number;
    setGradientSensitivity: (value: number) => void;
    lang: Locale;
}

export const SuperpixelControls: React.FC<SuperpixelControlsProps> = ({
    dict,
    params,
    handleParamChange,
    handleImageChange,
    processImage,
    loading,
    imageFile,
    strokeData,
    showGradients,
    setShowGradients,
    showCenters,
    setShowCenters,
    showColorGradient,
    setShowColorGradient,
    gradientSensitivity,
    setGradientSensitivity,
    lang
}) => {
    return (
        <Card>
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="imageFile" className="block">
                            {dict.selectImage}
                        </Label>
                        <Input
                            id="imageFile"
                            type="file"
                            accept="image/jpeg,image/png"
                            onChange={handleImageChange}
                            className="cursor-pointer dark:file:text-white"
                        />
                    </div>

                    <Button
                        onClick={processImage}
                        className="w-full"
                        disabled={loading || !imageFile}
                    >
                        {loading ? (
                            <>
                                <Spinner className="mr-2 h-4 w-4" />
                                {dict.loading}
                            </>
                        ) : (
                            <>
                                <ArrowRight className="mr-2 h-4 w-4" />
                                {dict.processImage}
                            </>
                        )}
                    </Button>

                    <Separator />

                    <h2 className="text-xl font-semibold">{dict.parameters}</h2>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.numberOfSuperpixels}</Label>
                                <span className="text-sm">{params.numberOfSuperpixels}</span>
                            </div>
                            <Slider
                                min={10}
                                max={5000}
                                step={10}
                                value={[params.numberOfSuperpixels]}
                                onValueChange={(value) => handleParamChange('numberOfSuperpixels', value[0])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.compactnessFactor}</Label>
                                <span className="text-sm">{params.compactnessFactor}</span>
                            </div>
                            <Slider
                                min={1}
                                max={100}
                                step={1}
                                value={[params.compactnessFactor]}
                                onValueChange={(value) => handleParamChange('compactnessFactor', value[0])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.elongation}</Label>
                                <span className="text-sm">{params.elongation.toFixed(1)}</span>
                            </div>
                            <Slider
                                min={1}
                                max={10}
                                step={0.1}
                                value={[params.elongation]}
                                onValueChange={(value) => handleParamChange('elongation', value[0])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.iterations}</Label>
                                <span className="text-sm">{params.iterations}</span>
                            </div>
                            <Slider
                                min={1}
                                max={30}
                                step={1}
                                value={[params.iterations]}
                                onValueChange={(value) => handleParamChange('iterations', value[0])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.gridSize}</Label>
                                <span className="text-sm">{params.gridSize}</span>
                            </div>
                            <Slider
                                min={5}
                                max={30}
                                step={1}
                                value={[params.gridSize]}
                                onValueChange={(value) => handleParamChange('gridSize', value[0])}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Label>{dict.adaptiveFactor}</Label>
                                <span className="text-sm">{params.adaptiveFactor.toFixed(1)}</span>
                            </div>
                            <Slider
                                min={0}
                                max={1}
                                step={0.1}
                                value={[params.adaptiveFactor]}
                                onValueChange={(value) => handleParamChange('adaptiveFactor', value[0])}
                            />
                        </div>
                    </div>

                    <Separator className="my-4" />

                    {strokeData && (
                        <div className="space-y-3">
                            <h3 className="font-medium">{lang === "en" ? "Visualization Layers" : "Слои визуализации"}</h3>
                            <div className="flex flex-col gap-2 mt-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={showGradients}
                                        onChange={(e) => setShowGradients(e.target.checked)}
                                        className="rounded"
                                    />
                                    {dict.showGradients}
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={showCenters}
                                        onChange={(e) => setShowCenters(e.target.checked)}
                                        className="rounded"
                                    />
                                    {dict.showCenters}
                                </label>

                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={showColorGradient}
                                        onChange={(e) => setShowColorGradient(e.target.checked)}
                                        className="rounded"
                                    />
                                    {dict.showColorGradient}
                                </label>
                            </div>

                            {showColorGradient && (
                                <div className="mt-2">
                                    <div className="flex justify-between">
                                        <Label>{dict.gradientSensitivity}</Label>
                                        <span className="text-sm">{gradientSensitivity.toFixed(1)}</span>
                                    </div>
                                    <Slider
                                        min={0.1}
                                        max={2.0}
                                        step={0.1}
                                        value={[gradientSensitivity]}
                                        onValueChange={(value) => setGradientSensitivity(value[0])}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}; 