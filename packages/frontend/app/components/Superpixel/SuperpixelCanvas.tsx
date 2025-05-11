"use client";

import { useRef, useEffect } from "react";
import { updateGradientsView } from "./utils";
import { drawAllStrokes, drawAllStrokesPixelMode, drawBorders, computeConvexHull, expandConvexHull } from "./CanvasDrawing";

interface SuperpixelCanvasProps {
    strokeData: any;
    originalCanvasRef: React.RefObject<HTMLCanvasElement>;
    strokesCanvasRef: React.RefObject<HTMLCanvasElement>;
    gradientsCanvasRef: React.RefObject<HTMLCanvasElement>;
    highlightCanvasRef: React.RefObject<HTMLCanvasElement>;
    bordersCanvasRef: React.RefObject<HTMLCanvasElement>;
    scaleX: number;
    scaleY: number;
    showGradients: boolean;
    showCenters: boolean;
    showColorGradient: boolean;
    gradientSensitivity: number;
    setHighlightedStrokeId: (id: number | null) => void;
    highlightedStrokeId: number | null;
    processingMode: "strokes" | "pixels";
}

export const SuperpixelCanvas: React.FC<SuperpixelCanvasProps> = ({
    strokeData,
    originalCanvasRef,
    strokesCanvasRef,
    gradientsCanvasRef,
    highlightCanvasRef,
    bordersCanvasRef,
    scaleX,
    scaleY,
    showGradients,
    showCenters,
    showColorGradient,
    gradientSensitivity,
    setHighlightedStrokeId,
    highlightedStrokeId,
    processingMode
}) => {
    // Переменная для анимации пунктирной линии
    const lineDashOffsetRef = useRef(0);
    const animationRef = useRef<number>();

    // Функция для анимации пунктирной линии
    const animateDashOffset = () => {
        if (!highlightCanvasRef.current || highlightedStrokeId === null) return;

        lineDashOffsetRef.current -= 0.5; // Скорость анимации
        if (lineDashOffsetRef.current < 0) lineDashOffsetRef.current = 6; // Сброс смещения

        const ctx = highlightCanvasRef.current.getContext('2d');
        if (ctx && strokeData && highlightedStrokeId !== null) {
            const stroke = strokeData.strokes.find((s: any) => s.id === highlightedStrokeId);
            if (stroke) {
                drawStrokeHighlight(ctx, stroke);
            }
        }

        animationRef.current = requestAnimationFrame(animateDashOffset);
    };

    // Остановка анимации при размонтировании компонента
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Запуск/остановка анимации при изменении highlightedStrokeId
    useEffect(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = undefined;
        }

        if (highlightedStrokeId !== null) {
            // Начать анимацию
            if (!animationRef.current) {
                animationRef.current = requestAnimationFrame(animateDashOffset);
            }
        } else {
            // Остановить анимацию
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
                animationRef.current = undefined;
            }

            // Очищаем канвас выделения при сбросе highlightedStrokeId
            if (highlightCanvasRef.current) {
                const ctx = highlightCanvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, highlightCanvasRef.current.width, highlightCanvasRef.current.height);
                }
            }
        }
    }, [highlightedStrokeId]);

    // Перерисовка выделения при изменении данных о строках
    useEffect(() => {
        setHighlightedStrokeId(null);

        // Отрисовка мазков с использованием выпуклых оболочек или отдельных пикселей
        if (strokeData && strokesCanvasRef.current) {
            if (processingMode === "pixels") {
                drawAllStrokesPixelMode(
                    strokesCanvasRef.current,
                    strokeData.strokes,
                    scaleX,
                    scaleY
                );
            } else {
                drawAllStrokes(
                    strokesCanvasRef.current,
                    strokeData.strokes,
                    scaleX,
                    scaleY
                );
            }

            // Отрисовка границ мазков
            if (bordersCanvasRef.current) {
                drawBorders(
                    bordersCanvasRef.current,
                    strokeData.strokes,
                    scaleX,
                    scaleY,
                );
            }
        }
    }, [strokeData, scaleX, scaleY, processingMode]);

    // Обновление градиентного вида при изменении данных или настроек отображения
    useEffect(() => {
        if (!strokeData || !gradientsCanvasRef.current || !originalCanvasRef.current) return;

        const drawGradientVectors = (ctx: CanvasRenderingContext2D, vectors: any[], scaleX: number, scaleY: number) => {
            // Draw each vector
            for (const vector of vectors) {
                // Scale coordinates
                const x = Math.floor(vector.x * scaleX);
                const y = Math.floor(vector.y * scaleY);

                // Calculate line length based on vector magnitude
                const lineLength = 10 + vector.length * 20;

                // Calculate endpoint
                const endX = x + Math.cos(vector.theta) * lineLength;
                const endY = y + Math.sin(vector.theta) * lineLength;

                // Draw vector line
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(endX, endY);
                ctx.strokeStyle = "rgba(0, 100, 255, 0.7)";
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Draw arrow tip
                const arrowSize = 5;
                const angle = vector.theta;

                ctx.beginPath();
                ctx.moveTo(endX, endY);
                ctx.lineTo(
                    endX - arrowSize * Math.cos(angle - Math.PI / 6),
                    endY - arrowSize * Math.sin(angle - Math.PI / 6)
                );
                ctx.lineTo(
                    endX - arrowSize * Math.cos(angle + Math.PI / 6),
                    endY - arrowSize * Math.sin(angle + Math.PI / 6)
                );
                ctx.closePath();
                ctx.fillStyle = "rgba(0, 100, 255, 0.9)";
                ctx.fill();

                // Draw origin point
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
                ctx.fill();
            }
        };

        const drawClusterCenters = (ctx: CanvasRenderingContext2D, strokes: any[], scaleX: number, scaleY: number) => {
            if (!strokes || strokes.length === 0) return;

            ctx.save();

            // Draw centers
            for (const stroke of strokes) {
                const x = Math.floor(stroke.centerX * scaleX);
                const y = Math.floor(stroke.centerY * scaleY);

                // Draw crosshair
                const size = 5;

                ctx.beginPath();
                // Horizontal line
                ctx.moveTo(x - size, y);
                ctx.lineTo(x + size, y);
                // Vertical line
                ctx.moveTo(x, y - size);
                ctx.lineTo(x, y + size);

                ctx.strokeStyle = "rgba(255, 0, 0, 0.8)";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Draw center circle
                ctx.beginPath();
                ctx.arc(x, y, 2, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 255, 0, 0.9)";
                ctx.fill();
            }

            ctx.restore();
        };

        // Обновляем вид градиентов с использованием WebGL
        updateGradientsView(
            strokeData,
            originalCanvasRef,
            gradientsCanvasRef,
            showGradients,
            showCenters,
            showColorGradient,
            gradientSensitivity,
            drawGradientVectors,
            drawClusterCenters
        );
    }, [strokeData, showGradients, showCenters, showColorGradient, gradientSensitivity]);

    // Find the nearest stroke to mouse position
    const findNearestStroke = (mouseX: number, mouseY: number, strokes: any[]) => {
        let nearestStroke = null;
        let minDistance = Infinity;
        const searchRadius = 20; // 20px radius

        for (const stroke of strokes) {
            // Scale center coordinates
            const centerX = stroke.centerX * scaleX;
            const centerY = stroke.centerY * scaleY;

            const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

            if (distance < minDistance && distance < searchRadius) {
                minDistance = distance;
                nearestStroke = stroke;
            }
        }

        return nearestStroke;
    };

    // Draw stroke highlight using convex hull or bounding box based on the mode
    const drawStrokeHighlight = (ctx: CanvasRenderingContext2D, stroke: any) => {
        if (!stroke) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Highlight strategy depends on the processing mode
        if (processingMode === "pixels") {
            // For pixel mode, just draw a bounding box around all pixels
            const points = stroke.pixels.map((pixel: number[]) => ({
                x: Math.floor(pixel[0] * scaleX),
                y: Math.floor(pixel[1] * scaleY)
            }));

            if (points.length > 0) {
                // Find the bounding box
                let minX = points[0].x;
                let minY = points[0].y;
                let maxX = points[0].x;
                let maxY = points[0].y;

                for (const p of points) {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                }

                // Add padding
                minX -= 2;
                minY -= 2;
                maxX += 2;
                maxY += 2;

                // Draw a rectangle with glow effect
                ctx.shadowColor = 'rgba(62, 148, 236, 0.6)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'rgba(62, 148, 236, 0.1)';
                ctx.fillRect(minX, minY, maxX - minX, maxY - minY);

                // Reset shadow for border
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                // Draw dashed border
                ctx.strokeStyle = 'rgba(62, 148, 236, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 2]);
                ctx.lineDashOffset = lineDashOffsetRef.current;
                ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
                ctx.setLineDash([]);
            }
        } else {
            // For strokes mode, use convex hull as before
            const points = stroke.pixels.map((pixel: number[]) => ({
                x: Math.floor(pixel[0] * scaleX),
                y: Math.floor(pixel[1] * scaleY)
            }));

            // Use computeConvexHull for strokes mode
            let hull: { x: number, y: number }[] = [];

            if (points.length > 0) {
                if (points.length >= 3) {
                    // Compute and expand the convex hull
                    hull = computeConvexHull(points);
                    hull = expandConvexHull(hull, 2);
                } else {
                    // Create a bounding rectangle for small strokes
                    let minX = points[0].x;
                    let minY = points[0].y;
                    let maxX = points[0].x;
                    let maxY = points[0].y;

                    for (const p of points) {
                        minX = Math.min(minX, p.x);
                        minY = Math.min(minY, p.y);
                        maxX = Math.max(maxX, p.x);
                        maxY = Math.max(maxY, p.y);
                    }

                    // Add padding
                    hull = [
                        { x: minX - 2, y: minY - 2 },
                        { x: maxX + 2, y: minY - 2 },
                        { x: maxX + 2, y: maxY + 2 },
                        { x: minX - 2, y: maxY + 2 }
                    ];
                }
            }

            // Draw the hull with glow effect
            if (hull.length > 0) {
                ctx.beginPath();
                ctx.moveTo(hull[0].x, hull[0].y);

                for (let i = 1; i < hull.length; i++) {
                    ctx.lineTo(hull[i].x, hull[i].y);
                }

                ctx.closePath();

                ctx.shadowColor = 'rgba(62, 148, 236, 0.6)';
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'rgba(62, 148, 236, 0.1)';
                ctx.fill();

                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                ctx.strokeStyle = 'rgba(62, 148, 236, 0.8)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([4, 2]);
                ctx.lineDashOffset = lineDashOffsetRef.current;
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Draw orientation vector
        const centerX = stroke.centerX * scaleX;
        const centerY = stroke.centerY * scaleY;
        const vectorLength = 25; // Slightly shorter for elegance
        const angle = stroke.theta;
        const endX = centerX + Math.cos(angle) * vectorLength;
        const endY = centerY + Math.sin(angle) * vectorLength;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(62, 148, 236, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw arrowhead
        const arrowSize = 5;
        const arrowAngle = Math.PI / 8;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - Math.cos(angle - arrowAngle) * arrowSize,
            endY - Math.sin(angle - arrowAngle) * arrowSize
        );
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - Math.cos(angle + arrowAngle) * arrowSize,
            endY - Math.sin(angle + arrowAngle) * arrowSize
        );
        ctx.strokeStyle = 'rgba(62, 148, 236, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw center point with gradient fill
        const pointRadius = 4;
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, pointRadius
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(62, 148, 236, 0.7)');

        ctx.beginPath();
        ctx.arc(centerX, centerY, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    };

    // Add mouse event handlers
    useEffect(() => {
        const strokesCanvas = strokesCanvasRef.current;
        if (!strokesCanvas) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!strokeData || !strokeData.strokes) return;

            const rect = strokesCanvas.getBoundingClientRect();
            const mouseX = event.clientX - rect.left;
            const mouseY = event.clientY - rect.top;

            const nearestStroke = findNearestStroke(mouseX, mouseY, strokeData.strokes);

            // Update highlighted stroke if it changed
            const newNearestId = nearestStroke ? nearestStroke.id : null;
            if (newNearestId !== highlightedStrokeId) {
                setHighlightedStrokeId(newNearestId);

                if (highlightCanvasRef.current) {
                    const highlightCtx = highlightCanvasRef.current.getContext('2d');
                    if (highlightCtx) {
                        drawStrokeHighlight(highlightCtx, nearestStroke);
                    }
                }
            }
        };

        const handleMouseOut = () => {
            setHighlightedStrokeId(null);

            if (highlightCanvasRef.current) {
                const highlightCtx = highlightCanvasRef.current.getContext('2d');
                if (highlightCtx) {
                    highlightCtx.clearRect(0, 0, highlightCanvasRef.current.width, highlightCanvasRef.current.height);
                }
            }
        };

        // Добавляем обработчик событий ко всем слоям канваса
        const allCanvases = [
            strokesCanvasRef.current,
            bordersCanvasRef.current,
            gradientsCanvasRef.current
        ].filter(Boolean) as HTMLCanvasElement[];

        allCanvases.forEach(canvas => {
            canvas.addEventListener('mousemove', handleMouseMove);
            canvas.addEventListener('mouseout', handleMouseOut);
        });

        return () => {
            allCanvases.forEach(canvas => {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseout', handleMouseOut);
            });
        };
    }, [strokeData, highlightedStrokeId, scaleX, scaleY]);

    return null; // Этот компонент не рендерит UI, а только добавляет функциональность
}; 