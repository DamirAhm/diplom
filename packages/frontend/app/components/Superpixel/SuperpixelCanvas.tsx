"use client";

import { useRef, useEffect } from "react";
import { computeConvexHull, crossProduct } from "./utils";

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
    highlightedStrokeId
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
    }, [strokeData]);

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

    // Draw stroke highlight (using convex hull rather than bounding box)
    const drawStrokeHighlight = (ctx: CanvasRenderingContext2D, stroke: any) => {
        if (!stroke) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Get pixel coordinates
        const pixels = stroke.pixels.map((pixel: number[]) => ({
            x: Math.floor(pixel[0] * scaleX),
            y: Math.floor(pixel[1] * scaleY)
        }));

        // Create convex hull using Andrew's monotone chain algorithm
        const hull = computeConvexHull(pixels);

        // Draw convex hull with smooth style
        if (hull.length > 0) {
            // Draw filled shape with a subtle glow effect
            ctx.beginPath();
            ctx.moveTo(hull[0].x, hull[0].y);

            for (let i = 1; i < hull.length; i++) {
                ctx.lineTo(hull[i].x, hull[i].y);
            }

            ctx.closePath();

            // Создаем свечение вокруг выделения
            ctx.shadowColor = 'rgba(62, 148, 236, 0.6)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(62, 148, 236, 0.1)';
            ctx.fill();

            // Сбрасываем настройки тени для обводки
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Рисуем анимированную обводку с пунктирной линией
            ctx.strokeStyle = 'rgba(62, 148, 236, 0.8)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 2]); // Пунктирная линия
            ctx.lineDashOffset = lineDashOffsetRef.current; // Анимированное смещение
            ctx.stroke();
            ctx.setLineDash([]); // Сброс стиля линии
        }

        // Draw orientation vector - используем цвет, соответствующий теме
        const centerX = stroke.centerX * scaleX;
        const centerY = stroke.centerY * scaleY;
        const vectorLength = 25; // Немного уменьшаем длину для элегантности
        const angle = stroke.theta;
        const endX = centerX + Math.cos(angle) * vectorLength;
        const endY = centerY + Math.sin(angle) * vectorLength;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = 'rgba(62, 148, 236, 0.9)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Рисуем стрелку на конце вектора
        const arrowSize = 5;
        const arrowAngle = Math.PI / 8; // Угол для стрелки

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

        // Draw center point - с красивым градиентным заполнением
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