// Draw all strokes on canvas
export const drawAllStrokes = async (
    canvas: HTMLCanvasElement,
    strokes: any[],
    scaleX: number,
    scaleY: number,
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Отрисуем только пиксели суперпикселей без границ
    for (const stroke of strokes) {
        await new Promise(resolve => setTimeout(resolve));

        ctx.fillStyle = `rgb(${stroke.color[0]}, ${stroke.color[1]}, ${stroke.color[2]})`;

        for (const pixel of stroke.pixels) {
            const x = Math.floor(pixel[0] * scaleX);
            const y = Math.floor(pixel[1] * scaleY);
            const brushSize = Math.max(1, Math.min(scaleX, scaleY));

            ctx.beginPath();
            ctx.arc(x + 0.5, y + 0.5, Math.max(0.5, brushSize / 2), 0, Math.PI * 2);
            ctx.fill();
        }
    }
};

// Draw borders of superpixels on a separate layer
export const drawBorders = async (
    canvas: HTMLCanvasElement,
    strokes: any[],
    scaleX: number,
    scaleY: number,
    computeConvexHull: (points: { x: number, y: number }[]) => { x: number, y: number }[]
) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Более стильный и тонкий вид границ
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.lineWidth = 0.6;

    // Найдем максимальное и минимальное количество пикселей в кластерах
    // для нормализации прозрачности
    let maxPixels = 0;
    let minPixels = Infinity;

    for (const stroke of strokes) {
        if (stroke.pixels.length > maxPixels) maxPixels = stroke.pixels.length;
        if (stroke.pixels.length < minPixels) minPixels = stroke.pixels.length;
    }

    // Диапазон прозрачности
    const minOpacity = 0.3;
    const maxOpacity = 0.8;

    for (const stroke of strokes) {
        await new Promise(resolve => setTimeout(resolve));

        if (stroke.pixels.length < 2) continue;

        // Используем пиксели на границе для отрисовки контура
        const edges = stroke.pixels.filter((pixel: number[]) => {
            // Простой эвристический способ определения краевых пикселей
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = pixel[0] + dx;
                    const ny = pixel[1] + dy;
                    // Если соседний пиксель не принадлежит этому стрику,
                    // значит текущий пиксель находится на границе
                    const found = stroke.pixels.some((p: number[]) => p[0] === nx && p[1] === ny);
                    if (!found) return true;
                }
            }
            return false;
        });

        if (edges.length > 0) {
            const edgePoints = edges.map((pixel: number[]) => ({
                x: Math.floor(pixel[0] * scaleX),
                y: Math.floor(pixel[1] * scaleY)
            }));

            // Отсортируем точки для более плавного контура
            const hull = computeConvexHull(edgePoints);

            if (hull.length > 2) {
                ctx.beginPath();
                ctx.moveTo(hull[0].x, hull[0].y);

                for (let i = 1; i < hull.length; i++) {
                    ctx.lineTo(hull[i].x, hull[i].y);
                }

                ctx.closePath();

                // Прозрачность зависит от размера кластера
                const pixelCountNormalized = (stroke.pixels.length - minPixels) / (maxPixels - minPixels || 1);
                const opacity = minOpacity + pixelCountNormalized * (maxOpacity - minOpacity);

                // Заливка кластера с полупрозрачным цветом
                ctx.fillStyle = `rgba(${stroke.color.join(',')}, ${opacity.toFixed(2)})`;
                ctx.fill();

                // Отрисовка контура поверх заливки
                ctx.stroke();
            }
        }
    }
};

// Update gradients view based on checkbox states
export const updateGradientsView = (
    strokeData: any,
    gradientsCanvasRef: React.RefObject<HTMLCanvasElement>,
    showGradients: boolean,
    showCenters: boolean,
    showColorGradient: boolean,
    gradientSensitivity: number,
    drawGradientVectors: (ctx: CanvasRenderingContext2D, vectors: any[]) => void,
    drawClusterCenters: (ctx: CanvasRenderingContext2D, strokes: any[]) => void,
    drawColorGradient: (ctx: CanvasRenderingContext2D, gradientData: number[][], sensitivity: number) => void
) => {
    if (!strokeData || !gradientsCanvasRef.current) return;

    const ctx = gradientsCanvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, gradientsCanvasRef.current.width, gradientsCanvasRef.current.height);

    // Обновленный метод отрисовки градиентов
    // Не используем изображение как подложку, а рисуем градиенты напрямую
    ctx.globalAlpha = 0.7; // Полупрозрачность для градиентов

    // Draw color gradient heatmap if enabled
    if (showColorGradient && strokeData.gradientDebug) {
        drawColorGradient(ctx, strokeData.gradientDebug, gradientSensitivity);
    }

    // Draw gradient vectors if enabled
    if (showGradients && strokeData.gridVectors) {
        drawGradientVectors(ctx, strokeData.gridVectors);
    }

    // Draw cluster centers if enabled
    if (showCenters && strokeData.strokes) {
        drawClusterCenters(ctx, strokeData.strokes);
    }

    ctx.globalAlpha = 1.0; // Сбрасываем прозрачность
};

// Draw gradient vectors
export const drawGradientVectors = (ctx: CanvasRenderingContext2D, vectors: any[], scaleX: number, scaleY: number) => {
    // Рисуем вектора напрямую без предварительной отрисовки оригинального изображения
    // Это избавит от перекрытия канвасов

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
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.7)';
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
        ctx.fillStyle = 'rgba(0, 100, 255, 0.9)';
        ctx.fill();

        // Draw origin point
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.fill();
    }
};

// Draw cluster centers
export const drawClusterCenters = (ctx: CanvasRenderingContext2D, strokes: any[], scaleX: number, scaleY: number) => {
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

        ctx.strokeStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw center circle
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 0, 0.9)';
        ctx.fill();
    }

    ctx.restore();
};

// Draw color gradient heatmap
export const drawColorGradient = (
    ctx: CanvasRenderingContext2D,
    gradientData: number[][],
    sensitivity: number
) => {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Create ImageData for gradient
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Calculate scale factors
    const scaleFactorX = width / gradientData[0].length;
    const scaleFactorY = height / gradientData.length;

    // Fill image data with gradient values
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Map canvas coordinates to gradient data coordinates
            const gradientX = Math.min(Math.floor(x / scaleFactorX), gradientData[0].length - 1);
            const gradientY = Math.min(Math.floor(y / scaleFactorY), gradientData.length - 1);

            // Get gradient value (0.0-1.0)
            let value = gradientData[gradientY][gradientX];

            // Apply sensitivity adjustment
            if (sensitivity !== 1.0) {
                value = Math.pow(value, 1.0 / sensitivity);
                value = Math.max(0, Math.min(1, value));
            }

            // Use vibrant heatmap colors
            let r, g, b;

            if (value < 0.33) {
                // Magenta to yellow (low to medium-low)
                const t = value * 3;
                r = 255;
                g = Math.floor(255 * t);
                b = Math.floor(255 * (1 - t));
            } else if (value < 0.66) {
                // Yellow to white (medium-low to medium-high)
                const t = (value - 0.33) * 3;
                r = 255;
                g = 255;
                b = Math.floor(255 * t);
            } else {
                // White to cyan (medium-high to high)
                const t = (value - 0.66) * 3;
                r = Math.floor(255 * (1 - t));
                g = 255;
                b = 255;
            }

            // Set pixel with opacity
            const idx = (y * width + x) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
            data[idx + 3] = 200; // Alpha
        }
    }

    // Draw the gradient
    ctx.putImageData(imageData, 0, 0);

    // Add legend
    drawGradientLegend(ctx, width, height, sensitivity);
};

// Draw gradient legend
export const drawGradientLegend = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    sensitivity: number
) => {
    const legendWidth = 200;
    const legendHeight = 20;
    const legendX = width - legendWidth - 10;
    const legendY = height - legendHeight - 10;

    // Create gradient bar
    const gradientBar = ctx.createLinearGradient(legendX, 0, legendX + legendWidth, 0);
    gradientBar.addColorStop(0, "rgba(255, 0, 255, 0.9)"); // Magenta (low)
    gradientBar.addColorStop(0.33, "rgba(255, 255, 0, 0.9)"); // Yellow (medium-low)
    gradientBar.addColorStop(0.66, "rgba(255, 255, 255, 0.9)"); // White (medium-high)
    gradientBar.addColorStop(1, "rgba(0, 255, 255, 0.9)"); // Cyan (high)

    // Draw legend background
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(legendX - 2, legendY - 2, legendWidth + 4, legendHeight + 4);

    // Draw gradient
    ctx.fillStyle = gradientBar;
    ctx.fillRect(legendX, legendY, legendWidth, legendHeight);

    // Add labels
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText(`Weak Gradient (x${sensitivity.toFixed(1)})`, legendX, legendY - 5);
    ctx.fillText("Strong Gradient", legendX + legendWidth - 100, legendY - 5);
}; 