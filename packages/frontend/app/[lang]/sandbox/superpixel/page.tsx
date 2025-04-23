"use client";

import { useState, useRef, useEffect } from "react";
import { getDictionary } from "@/app/dictionaries";
import type { Locale } from "@/app/types";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { ImageIcon, Upload } from "lucide-react";
import { processSuperpixelImage, SuperpixelParams as ApiSuperpixelParams } from "@/lib/api";
import { SuperpixelControls } from "@/app/components/Superpixel/SuperpixelControls";
import { SuperpixelCanvas } from "@/app/components/Superpixel/SuperpixelCanvas";
import {
    drawAllStrokes,
    updateGradientsView,
    drawGradientVectors,
    drawClusterCenters,
    drawColorGradient,
    drawBorders
} from "@/app/components/Superpixel/CanvasDrawing";
import { computeConvexHull } from "@/app/components/Superpixel/utils";
import { cn } from "@/lib/utils";

interface SuperpixelParams extends ApiSuperpixelParams { }

export default function SuperpixelPage({
    params: { lang },
}: {
    params: { lang: Locale };
}) {
    const dict = getDictionary(lang).sandbox.superpixel;
    const { toast } = useToast();

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
        compactnessFactor: 3,
        elongation: 2.0,
        iterations: 10,
        gridSize: 20,
        adaptiveFactor: 0.5
    });
    const [strokeData, setStrokeData] = useState<any>(null);
    const [highlightedStrokeId, setHighlightedStrokeId] = useState<number | null>(null);
    const [strokesRendered, setStrokesRendered] = useState(false);
    const [bordersRendered, setBordersRendered] = useState(false);

    const [drawOptions, setDrawOptions] = useState({
        drawCenters: false,
        drawBorders: true,
        useGradientColors: false,
        showGradients: false,
        showStrokes: true
    });

    const [gradientSensitivity, setGradientSensitivity] = useState(1.0);

    const [scaleX, setScaleX] = useState(1);
    const [scaleY, setScaleY] = useState(1);

    const handleImageChange = (file: File) => {
        setImageFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setPreviewUrl(e.target.result as string);

                const img = new Image();
                img.onload = () => {
                    if (originalCanvasRef.current) {
                        const maxWidth = 800;
                        const maxHeight = 600;
                        let width = img.width;
                        let height = img.height;

                        if (width > maxWidth) {
                            height = (maxWidth / width) * height;
                            width = maxWidth;
                        }

                        if (height > maxHeight) {
                            width = (maxHeight / height) * width;
                            height = maxHeight;
                        }

                        setCanvasSizes(width, height);
                        setScaleX(width / img.width);
                        setScaleY(height / img.height);

                        const ctx = originalCanvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, width, height);
                            ctx.drawImage(img, 0, 0, width, height);
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
            bordersCanvasRef.current
        ];

        canvases.forEach(canvas => {
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
            bordersCanvasRef.current
        ];

        canvases.forEach(canvas => {
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        });

        setStrokeData(null);
        setHighlightedStrokeId(null);
        setStrokesRendered(false);
        setBordersRendered(false);
    };

    const processImage = async () => {
        if (!imageFile) {
            toast({
                title: "Error",
                description: "Please select an image first",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        clearCanvases();
        setStrokesRendered(false);
        setBordersRendered(false);

        try {
            const data = await processSuperpixelImage(imageFile, params);
            setStrokeData(data);

            if (strokesCanvasRef.current) {
                if (strokesCanvasRef.current.parentElement) {
                    strokesCanvasRef.current.style.visibility = 'hidden';
                }

                await drawAllStrokes(strokesCanvasRef.current, data.strokes, scaleX, scaleY);
                setStrokesRendered(true);

                if (drawOptions.showStrokes && strokesCanvasRef.current.parentElement) {
                    strokesCanvasRef.current.style.visibility = 'visible';
                }
            }

            if (bordersCanvasRef.current) {
                if (bordersCanvasRef.current.parentElement) {
                    bordersCanvasRef.current.style.visibility = 'hidden';
                }

                await drawBorders(bordersCanvasRef.current, data.strokes, scaleX, scaleY, computeConvexHull);
                setBordersRendered(true);

                if (drawOptions.drawBorders && bordersCanvasRef.current.parentElement) {
                    bordersCanvasRef.current.style.visibility = 'visible';
                }
            }

            if (drawOptions.showGradients || drawOptions.drawCenters || drawOptions.useGradientColors) {
                const drawGradientVectorsWithScale = (ctx: CanvasRenderingContext2D, vectors: any[]) => {
                    drawGradientVectors(ctx, vectors, scaleX, scaleY);
                };

                const drawClusterCentersWithScale = (ctx: CanvasRenderingContext2D, strokes: any[]) => {
                    drawClusterCenters(ctx, strokes, scaleX, scaleY);
                };

                updateGradientsView(
                    data,
                    gradientsCanvasRef,
                    drawOptions.showGradients,
                    drawOptions.drawCenters,
                    drawOptions.useGradientColors,
                    gradientSensitivity,
                    drawGradientVectorsWithScale,
                    drawClusterCentersWithScale,
                    drawColorGradient
                );
            }
        } catch (error) {
            console.error('Error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "An error occurred while processing the image",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleParamChange = (paramName: keyof SuperpixelParams, value: number) => {
        setParams(prev => ({
            ...prev,
            [paramName]: value
        }));
    };

    useEffect(() => {
        if (strokeData && strokesRendered && strokesCanvasRef.current) {
            strokesCanvasRef.current.style.visibility = drawOptions.showStrokes ? 'visible' : 'hidden';
        }
    }, [strokeData, drawOptions.showStrokes, strokesRendered]);

    useEffect(() => {
        if (strokeData && bordersRendered && bordersCanvasRef.current) {
            bordersCanvasRef.current.style.visibility = drawOptions.drawBorders ? 'visible' : 'hidden';
        }
    }, [strokeData, drawOptions.drawBorders, bordersRendered]);

    useEffect(() => {
        if (strokeData) {
            if (drawOptions.showGradients || drawOptions.drawCenters || drawOptions.useGradientColors) {
                const drawGradientVectorsWithScale = (ctx: CanvasRenderingContext2D, vectors: any[]) => {
                    drawGradientVectors(ctx, vectors, scaleX, scaleY);
                };

                const drawClusterCentersWithScale = (ctx: CanvasRenderingContext2D, strokes: any[]) => {
                    drawClusterCenters(ctx, strokes, scaleX, scaleY);
                };

                updateGradientsView(
                    strokeData,
                    gradientsCanvasRef,
                    drawOptions.showGradients,
                    drawOptions.drawCenters,
                    drawOptions.useGradientColors,
                    gradientSensitivity,
                    drawGradientVectorsWithScale,
                    drawClusterCentersWithScale,
                    drawColorGradient
                );
            } else {
                if (gradientsCanvasRef.current) {
                    const ctx = gradientsCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, gradientsCanvasRef.current.width, gradientsCanvasRef.current.height);
                    }
                }
            }
        }
    }, [drawOptions.showGradients, drawOptions.drawCenters, drawOptions.useGradientColors, gradientSensitivity, strokeData]);

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
                            <SuperpixelControls
                                params={params}
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
                                        <Label className="text-muted-foreground">{dict.gradientSensitivity}</Label>
                                        <span className="font-medium text-foreground">{gradientSensitivity.toFixed(1)}</span>
                                    </div>
                                    <Input
                                        type="range"
                                        min={0.1}
                                        max={2.0}
                                        step={0.1}
                                        value={gradientSensitivity}
                                        onChange={(e) => setGradientSensitivity(parseFloat(e.target.value))}
                                        className="w-full cursor-pointer"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Visualization */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="original" className="w-full">
                        <TabsList className="mb-4 w-full bg-background border-b border-border">
                            <TabsTrigger value="original" className="data-[state=active]:bg-background">{dict.originalImage}</TabsTrigger>
                            <TabsTrigger value="strokes" className="data-[state=active]:bg-background">{dict.strokes}</TabsTrigger>
                        </TabsList>

                        <TabsContent value="original">
                            <Card className="border-border bg-card">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="relative flex justify-center items-center min-h-[400px]">
                                        <div className="overflow-auto max-h-[600px]">
                                            <canvas
                                                ref={originalCanvasRef}
                                                className={cn("max-w-full border border-border rounded", previewUrl ? "block" : "hidden")}
                                            />
                                        </div>
                                        <div className={cn("h-[400px] w-full flex items-center justify-center bg-muted rounded-lg border border-dashed border-border", previewUrl ? "hidden" : "flex")}>
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

                                        <div className={cn("relative overflow-auto max-h-[600px]", strokeData ? "flex" : "hidden")}>
                                            {/* Main layer with superpixels */}
                                            <canvas
                                                ref={strokesCanvasRef}
                                                className="max-w-full border border-border rounded"
                                                style={{ visibility: strokesRendered && drawOptions.showStrokes ? 'visible' : 'hidden' }}
                                            />

                                            {/* Layer for borders */}
                                            <canvas
                                                ref={bordersCanvasRef}
                                                className="absolute top-0 left-0 pointer-events-none"
                                                style={{ visibility: bordersRendered && drawOptions.drawBorders ? 'visible' : 'hidden', zIndex: 7 }}
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
                                        <div className={cn("h-[400px] w-full flex items-center justify-center bg-muted rounded-lg border border-dashed border-border", strokeData ? "hidden" : "flex")}>
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
                        <h3 className="text-xl font-semibold mb-4 text-foreground">{dict.algorithmDescription}</h3>
                        <p className="text-muted-foreground mb-4">
                            {dict.description}
                        </p>
                        <p className="text-muted-foreground mb-4">
                            {lang === "en" ? (
                                <>Instead of the standard distance metric, an elliptical metric is used: X² + (pY)² ≤ d², where p &gt; 1 is the elongation parameter.</>
                            ) : (
                                <>Вместо стандартной метрики расстояния используется эллиптическая метрика: X² + (pY)² ≤ d², где p &gt; 1 - параметр вытянутости.</>
                            )}
                        </p>
                        <p className="text-muted-foreground">
                            {lang === "en" ? (
                                <>This allows superpixels to grow p times faster along normals to the gradient than in the orthogonal direction, creating a brush stroke effect that follows object contours in the image.</>
                            ) : (
                                <>Это позволяет суперпикселям расти в p раз быстрее вдоль нормалей к градиенту, чем в ортогональном направлении, создавая эффект мазков кисти, следующих за контурами объектов на изображении.</>
                            )}
                        </p>
                    </div>

                    <div className="mt-6">
                        <h3 className="text-xl font-semibold mb-4 text-foreground">{dict.relatedPapers}</h3>
                        <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                            <li>
                                <a href="https://www.iro.umontreal.ca/~mignotte/IFT6150/Articles/SLIC_Superpixels.pdf"
                                    className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">
                                    SLIC Superpixels Compared to State-of-the-art Superpixel Methods
                                </a>
                            </li>
                            <li>
                                <a href="https://ieeexplore.ieee.org/document/8237702"
                                    className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">
                                    Structure-Sensitive Superpixels via Geodesic Distance
                                </a>
                            </li>
                            <li>
                                <a href="https://www.sciencedirect.com/science/article/abs/pii/S1077314218300146"
                                    className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">
                                    Linear Spectral Clustering Superpixel
                                </a>
                            </li>
                            <li>
                                <a href="https://ieeexplore.ieee.org/document/7025066"
                                    className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">
                                    {lang === "en" ? (
                                        "Similarity-Preserving Image-Image Domain Adaptation for Person Re-identification"
                                    ) : (
                                        "Адаптация доменов изображений с сохранением сходства для повторной идентификации личности"
                                    )}
                                </a>
                            </li>
                            <li>
                                <a href="https://www.cv-foundation.org/openaccess/content_cvpr_2015/papers/Li_Superpixel_Segmentation_Using_2015_CVPR_paper.pdf"
                                    className="text-primary hover:text-primary/80 hover:underline" target="_blank" rel="noopener noreferrer">
                                    {lang === "en" ? (
                                        "Superpixel Segmentation Using Linear Spectral Clustering"
                                    ) : (
                                        "Сегментация суперпикселей с использованием линейной спектральной кластеризации"
                                    )}
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
} 