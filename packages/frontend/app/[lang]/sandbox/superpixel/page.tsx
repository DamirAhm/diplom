"use client";

import { useState, useRef, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { ImageIcon, Upload } from "lucide-react";
import {
  processSuperpixelImage,
  SuperpixelParams as ApiSuperpixelParams,
} from "@/lib/api";
import { SuperpixelControls } from "@/app/components/Superpixel/SuperpixelControls";
import { SuperpixelCanvas } from "@/app/components/Superpixel/SuperpixelCanvas";
import {
  drawAllStrokes,
  updateGradientsView,
  drawGradientVectors,
  drawClusterCenters,
  drawBorders,
} from "@/app/components/Superpixel/CanvasDrawing";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

interface SuperpixelParams extends ApiSuperpixelParams { }

export default function SuperpixelPage({
  params: { lang },
}: {
  params: { lang: Locale };
}) {
  const dict = getDictionary(lang).sandbox.superpixel;
  const { toast } = useToast();
  const isRussian = lang === "ru";

  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const strokesCanvasRef = useRef<HTMLCanvasElement>(null);
  const gradientsCanvasRef = useRef<HTMLCanvasElement>(null);
  const highlightCanvasRef = useRef<HTMLCanvasElement>(null);
  const bordersCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [params, setParams] = useState<SuperpixelParams>({
    numberOfSuperpixels: 1000,
    compactnessFactor: 2,
    elongation: 2.0,
    iterations: 5,
    gridSize: 20,
    adaptiveFactor: 0.5,
    mode: "strokes"
  });
  const [strokeData, setStrokeData] = useState<any>(null);
  const [highlightedStrokeId, setHighlightedStrokeId] = useState<number | null>(
    null
  );
  const [originalImageFullDimensions, setOriginalImageFullDimensions] = useState<{ width: number; height: number } | null>(null);

  const [drawOptions, setDrawOptions] = useState({
    drawCenters: false,
    drawBorders: false,
    useGradientColors: false,
    showGradients: false,
    showStrokes: true,
  });

  const [gradientSensitivity, setGradientSensitivity] = useState(1.0);

  const [scaleX, setScaleX] = useState(1);
  const [scaleY, setScaleY] = useState(1);

  // Function to sort strokes by color similarity
  const sortStrokesByColor = (strokes: any[]) => {
    if (!strokes || strokes.length === 0) return strokes;

    const result = [...strokes];

    // Helper function to calculate color distance
    const colorDistance = (colorA: [number, number, number], colorB: [number, number, number]) => {
      const meanR = (colorA[0] + colorB[0]) / 2;

      return Math.sqrt(
        (2 + meanR / 256) * Math.pow(colorA[0] - colorB[0], 2) +
        4 * Math.pow(colorA[1] - colorB[1], 2) +
        (2 + (255 - meanR) / 256) * Math.pow(colorA[2] - colorB[2], 2)
      );
    };

    // Start with the first stroke
    const sortedStrokes = [result[0]];
    const remaining = result.slice(1);

    // For each position in the sorted array
    while (remaining.length > 0) {
      const lastStroke = sortedStrokes[sortedStrokes.length - 1];
      let nearestIndex = 0;
      let minDistance = Infinity;

      // Find the nearest stroke by color
      remaining.forEach((stroke, index) => {
        const distance = colorDistance(
          lastStroke.color as [number, number, number],
          stroke.color as [number, number, number]
        );
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = index;
        }
      });

      // Add the nearest stroke to the sorted array and remove from remaining
      sortedStrokes.push(remaining[nearestIndex]);
      remaining.splice(nearestIndex, 1);
    }

    return sortedStrokes;
  };

  const handleImageChange = (file: File) => {
    if (strokesCanvasRef.current) {
      const strokesCtx = strokesCanvasRef.current.getContext("2d");
      if (strokesCtx) {
        strokesCtx.clearRect(
          0,
          0,
          strokesCanvasRef.current.clientWidth,
          strokesCanvasRef.current.clientHeight
        );
        strokesCtx.fillStyle = "red";
        strokesCtx.fillRect(
          0,
          0,
          strokesCanvasRef.current.clientWidth,
          strokesCanvasRef.current.clientHeight
        );
      }
    }
    setImageFile(file);
    setOriginalImageFullDimensions(null); // Reset while loading new image

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPreviewUrl(e.target.result as string);

        const img = new Image();
        img.onload = () => {
          if (originalCanvasRef.current) {
            const originalWidth = img.width;
            const originalHeight = img.height;
            setOriginalImageFullDimensions({ width: originalWidth, height: originalHeight });

            const maxWidth = 800;
            const maxHeight = 600;
            let displayWidth = originalWidth;
            let displayHeight = originalHeight;

            if (displayWidth > maxWidth) {
              displayHeight = (maxWidth / displayWidth) * displayHeight;
              displayWidth = maxWidth;
            }

            if (displayHeight > maxHeight) {
              displayWidth = (maxHeight / displayHeight) * displayWidth;
              displayHeight = maxHeight;
            }

            setCanvasSizes(displayWidth, displayHeight); // Sets originalCanvasRef to display dimensions

            // Scale factors to draw results (in originalFullDimensions) onto display canvases
            setScaleX(displayWidth / originalWidth);
            setScaleY(displayHeight / originalHeight);

            const ctx = originalCanvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(0, 0, displayWidth, displayHeight);
              ctx.drawImage(img, 0, 0, displayWidth, displayHeight); // Draw scaled image for display
            }

            clearCanvases();
          }
        };
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  const setCanvasSizes = (width: number, height: number) => {
    const canvases = [
      originalCanvasRef.current,
      strokesCanvasRef.current,
      gradientsCanvasRef.current,
      highlightCanvasRef.current,
      bordersCanvasRef.current,
    ];

    canvases.forEach((canvas) => {
      if (canvas) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
      }
    });
  };

  const clearCanvases = () => {
    const canvases = [
      strokesCanvasRef.current,
      gradientsCanvasRef.current,
      highlightCanvasRef.current,
      bordersCanvasRef.current,
    ];

    canvases.forEach((canvas) => {
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
    });

    setStrokeData(null);
    setHighlightedStrokeId(null);
  };

  const processImage = async () => {
    if (!previewUrl || !originalImageFullDimensions) {
      toast({
        title: "Error",
        description: "Please select an image and wait for it to load first.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    clearCanvases();

    try {
      // Create an Image object to draw on the offscreen canvas
      const processingImg = new Image();
      // Use a promise to ensure the image is loaded before proceeding
      await new Promise<void>((resolve, reject) => {
        processingImg.onload = () => resolve();
        processingImg.onerror = (err) => reject(err);
        processingImg.src = previewUrl; // previewUrl contains the original image data URL
      });

      // Create an offscreen canvas with original image dimensions
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = originalImageFullDimensions.width;
      offscreenCanvas.height = originalImageFullDimensions.height;
      const offscreenCtx = offscreenCanvas.getContext('2d');

      if (!offscreenCtx) {
        toast({
          title: "Error",
          description: "Could not create offscreen canvas context",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Draw the full-resolution image onto the offscreen canvas
      offscreenCtx.drawImage(processingImg, 0, 0, originalImageFullDimensions.width, originalImageFullDimensions.height);

      // Get image data from the offscreen canvas as a Blob
      const imageBlob = await new Promise<Blob | null>((resolve) =>
        offscreenCanvas.toBlob(resolve, "image/png")
      );

      if (!imageBlob) {
        toast({
          title: "Error",
          description: "Could not get image data from offscreen canvas",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const data = await processSuperpixelImage(imageBlob, params);

      setLoading(false);

      // Sort strokes by color similarity
      if (data.strokes && data.strokes.length > 0) {
        data.strokes = sortStrokesByColor(data.strokes);
      }

      setStrokeData(data);

      if (strokesCanvasRef.current) {
        if (strokesCanvasRef.current.parentElement) {
          strokesCanvasRef.current.style.visibility = "hidden";
        }

        await drawAllStrokes(
          strokesCanvasRef.current,
          data.strokes,
          scaleX,
          scaleY
        );

        if (drawOptions.showStrokes && strokesCanvasRef.current.parentElement) {
          strokesCanvasRef.current.style.visibility = "visible";
        }
      }

      if (bordersCanvasRef.current) {
        if (bordersCanvasRef.current.parentElement) {
          bordersCanvasRef.current.style.visibility = "hidden";
        }

        await drawBorders(
          bordersCanvasRef.current,
          data.strokes,
          scaleX,
          scaleY,
        );

        if (drawOptions.drawBorders && bordersCanvasRef.current.parentElement) {
          bordersCanvasRef.current.style.visibility = "visible";
        }
      }

      if (
        drawOptions.showGradients ||
        drawOptions.drawCenters ||
        drawOptions.useGradientColors
      ) {
        const drawGradientVectorsWithScale = (
          ctx: CanvasRenderingContext2D,
          vectors: any[]
        ) => {
          drawGradientVectors(ctx, vectors, scaleX, scaleY);
        };

        const drawClusterCentersWithScale = (
          ctx: CanvasRenderingContext2D,
          strokes: any[]
        ) => {
          drawClusterCenters(ctx, strokes, scaleX, scaleY);
        };

        updateGradientsView(
          data,
          originalCanvasRef,
          gradientsCanvasRef,
          drawOptions.showGradients,
          drawOptions.drawCenters,
          drawOptions.useGradientColors,
          gradientSensitivity,
          drawGradientVectorsWithScale,
          drawClusterCentersWithScale,
        );
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while processing the image",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleParamChange = (
    paramName: keyof SuperpixelParams,
    value: number | string
  ) => {
    setParams((prev) => ({
      ...prev,
      [paramName]: value,
    }));
  };

  useEffect(() => {
    if (strokeData && strokesCanvasRef.current) {
      strokesCanvasRef.current.style.visibility = drawOptions.showStrokes
        ? "visible"
        : "hidden";
    }
  }, [strokeData, drawOptions.showStrokes]);

  useEffect(() => {
    if (strokeData && bordersCanvasRef.current) {
      bordersCanvasRef.current.style.visibility = drawOptions.drawBorders
        ? "visible"
        : "hidden";
    }
  }, [strokeData, drawOptions.drawBorders]);

  useEffect(() => {
    if (strokeData) {
      if (
        drawOptions.showGradients ||
        drawOptions.drawCenters ||
        drawOptions.useGradientColors
      ) {
        const drawGradientVectorsWithScale = (
          ctx: CanvasRenderingContext2D,
          vectors: any[]
        ) => {
          drawGradientVectors(ctx, vectors, scaleX, scaleY);
        };

        const drawClusterCentersWithScale = (
          ctx: CanvasRenderingContext2D,
          strokes: any[]
        ) => {
          drawClusterCenters(ctx, strokes, scaleX, scaleY);
        };

        updateGradientsView(
          strokeData,
          originalCanvasRef,
          gradientsCanvasRef,
          drawOptions.showGradients,
          drawOptions.drawCenters,
          drawOptions.useGradientColors,
          gradientSensitivity,
          drawGradientVectorsWithScale,
          drawClusterCentersWithScale,
        );
      } else {
        if (gradientsCanvasRef.current) {
          const ctx = gradientsCanvasRef.current.getContext("2d");
          if (ctx) {
            ctx.clearRect(
              0,
              0,
              gradientsCanvasRef.current.width,
              gradientsCanvasRef.current.height
            );
          }
        }
      }
    }
  }, [
    drawOptions.showGradients,
    drawOptions.drawCenters,
    drawOptions.useGradientColors,
    gradientSensitivity,
    strokeData,
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-foreground">{dict.title}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Control Panel */}
        <div className="lg:col-span-1">
          <Card className="border-border bg-card">
            <CardContent className="p-4 sm:p-6">
              <SuperpixelControls
                params={params}
                isImageSelected={imageFile !== null}
                onParamChange={handleParamChange}
                onImageSelect={handleImageChange}
                onProcess={processImage}
                isProcessing={loading}
                strokeData={strokeData}
                drawOptions={drawOptions}
                setDrawOptions={setDrawOptions}
              />

              {drawOptions.useGradientColors && (
                <div className="mt-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <Label className="text-muted-foreground">
                      {dict.gradientSensitivity}
                    </Label>
                    <span className="font-medium text-foreground">
                      {gradientSensitivity.toFixed(1)}
                    </span>
                  </div>
                  <Input
                    type="range"
                    min={0.1}
                    max={2.0}
                    step={0.1}
                    value={gradientSensitivity}
                    onChange={(e) =>
                      setGradientSensitivity(parseFloat(e.target.value))
                    }
                    className="w-full cursor-pointer"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-3">
          <Tabs defaultValue="original" className="flex  flex-col w-full">
            <TabsList className="mb-4 w-fit self-center border-b border-border">
              <TabsTrigger
                value="original"
              >
                {dict.originalImage}
              </TabsTrigger>
              <TabsTrigger
                value="strokes"
              >
                {dict.strokes}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="original">
              <Card className="border-border bg-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="relative flex justify-center items-center min-h-[400px]">
                    <div className="overflow-auto max-h-[600px]">
                      <canvas
                        ref={originalCanvasRef}
                        className={cn(
                          "max-w-full border border-border rounded",
                          previewUrl ? "block" : "hidden"
                        )}
                      />
                    </div>
                    <div
                      className={cn(
                        "h-[400px] w-full flex items-center justify-center bg-muted rounded-lg border border-dashed border-border",
                        previewUrl ? "hidden" : "flex"
                      )}
                    >
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {dict.selectImage}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="strokes">
              <Card className="border-border bg-card">
                <CardContent className="p-4 sm:p-6">
                  <div className="relative flex justify-center items-center min-h-[400px]">
                    <div
                      className={cn(
                        "relative overflow-auto max-h-[600px]",
                        strokeData ? "flex" : "hidden"
                      )}
                    >
                      {/* Main layer with superpixels */}
                      <canvas
                        ref={strokesCanvasRef}
                        className="max-w-full border border-border rounded"
                        style={{
                          visibility:
                            drawOptions.showStrokes
                              ? "visible"
                              : "hidden",
                        }}
                      />

                      {/* Layer for borders */}
                      <canvas
                        ref={bordersCanvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{
                          visibility:
                            drawOptions.drawBorders
                              ? "visible"
                              : "hidden",
                          zIndex: 7,
                        }}
                      />

                      {/* Layer for hover highlighting */}
                      <canvas
                        ref={highlightCanvasRef}
                        className="absolute top-0 left-0 bg-transparent pointer-events-none"
                        style={{ zIndex: 10 }}
                      />

                      {/* Layer for gradients - only if corresponding options are enabled */}
                      <canvas
                        ref={gradientsCanvasRef}
                        className="absolute top-0 left-0 pointer-events-none"
                        style={{ zIndex: 5 }}
                      />

                      {/* Add SuperpixelCanvas for mouse interactions */}
                      <SuperpixelCanvas
                        strokeData={strokeData}
                        originalCanvasRef={originalCanvasRef}
                        strokesCanvasRef={strokesCanvasRef}
                        gradientsCanvasRef={gradientsCanvasRef}
                        highlightCanvasRef={highlightCanvasRef}
                        bordersCanvasRef={bordersCanvasRef}
                        scaleX={scaleX}
                        scaleY={scaleY}
                        showGradients={drawOptions.showGradients}
                        showCenters={drawOptions.drawCenters}
                        showColorGradient={drawOptions.useGradientColors}
                        gradientSensitivity={gradientSensitivity}
                        setHighlightedStrokeId={setHighlightedStrokeId}
                        highlightedStrokeId={highlightedStrokeId}
                      />
                    </div>
                    <div
                      className={cn(
                        "h-[400px] w-full flex items-center justify-center bg-muted rounded-lg border border-dashed border-border",
                        strokeData ? "hidden" : "flex"
                      )}
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          {dict.processImage}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              {dict.algorithmDescription}
            </h3>
            <p className="text-muted-foreground mb-4">{dict.description}</p>
            <p className="text-muted-foreground mb-4">
              {dict.ellipticalMetric}
            </p>
            <p className="text-muted-foreground mb-4">
              {dict.metricExplanation}
            </p>

            <h4 className="text-lg font-semibold mt-6 mb-3 text-foreground">
              {dict.practicalApplications}
            </h4>
            <p className="text-muted-foreground mb-4">
              {(() => {
                const parts = dict.robotArtistIntro.split("$projectLink");
                return (
                  <>
                    {parts[0]}
                    <Link
                      href={`/${lang}/projects/1`}
                      className="text-primary hover:text-primary/80 hover:underline ml-1"
                    >
                      {dict.robotArtistName}
                    </Link>
                    {parts.length > 1 ? parts[1] : ""}
                  </>
                );
              })()}
            </p>

            <p className="text-muted-foreground mb-4">{dict.algorithmRole}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-4 text-foreground">
              {dict.relatedPapers}
            </h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>
                <a
                  href="https://www.mdpi.com/2411-5134/6/1/19"
                  className="text-primary hover:text-primary/80 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Image Preprocessing for Artistic Robotic Painting
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
