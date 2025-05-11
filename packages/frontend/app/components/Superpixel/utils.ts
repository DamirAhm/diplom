import { generateGradientWithWebGL, drawGradientVectors, drawClusterCenters } from './CanvasDrawing';

// Обновление отображения градиентов с использованием WebGL
export const updateGradientsView = (
    strokeData: any,
    originalCanvasRef: React.RefObject<HTMLCanvasElement>,
    gradientsCanvasRef: React.RefObject<HTMLCanvasElement>,
    showGradients: boolean,
    showCenters: boolean,
    showColorGradient: boolean,
    gradientSensitivity: number,
    drawGradientVectorsFn: (ctx: CanvasRenderingContext2D, vectors: any[], scaleX: number, scaleY: number) => void,
    drawClusterCentersFn: (ctx: CanvasRenderingContext2D, strokes: any[], scaleX: number, scaleY: number) => void
) => {
    if (!strokeData || !gradientsCanvasRef.current || !originalCanvasRef.current) return;

    const ctx = gradientsCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Очистка холста градиентов
    ctx.clearRect(
        0,
        0,
        gradientsCanvasRef.current.width,
        gradientsCanvasRef.current.height
    );

    // Используем WebGL для генерации градиента, даже если он не отображается
    // Это нужно для того, чтобы градиент всегда был доступен для других функций
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = gradientsCanvasRef.current.width;
    tempCanvas.height = gradientsCanvasRef.current.height;

    // Генерируем градиентную карту
    const webglSuccess = generateGradientWithWebGL(
        originalCanvasRef.current,
        tempCanvas,
        gradientSensitivity
    );

    // Если WebGL сработал и нужно отображать цветовой градиент
    if (webglSuccess && showColorGradient) {
        // Копируем результат с временного канваса на основной градиентный канвас
        ctx.drawImage(tempCanvas, 0, 0);
    } else if (!webglSuccess && showColorGradient) {
        // Fallback если WebGL не поддерживается - показываем сообщение об ошибке
        ctx.font = '14px Arial';
        ctx.fillStyle = 'red';
        ctx.fillText('WebGL не поддерживается вашим браузером', 10, 20);
    }

    // Draw gradient vectors if enabled
    if (showGradients && strokeData.gridVectors) {
        ctx.save();
        // Вычисляем масштаб отображения
        const scaleX = gradientsCanvasRef.current.width / strokeData.imageWidth;
        const scaleY = gradientsCanvasRef.current.height / strokeData.imageHeight;
        drawGradientVectorsFn(ctx, strokeData.gridVectors, scaleX, scaleY);
        ctx.restore();
    }

    // Draw cluster centers if enabled
    if (showCenters && strokeData.strokes) {
        ctx.save();
        // Вычисляем масштаб отображения
        const scaleX = gradientsCanvasRef.current.width / strokeData.imageWidth;
        const scaleY = gradientsCanvasRef.current.height / strokeData.imageHeight;
        drawClusterCentersFn(ctx, strokeData.strokes, scaleX, scaleY);
        ctx.restore();
    }
}; 