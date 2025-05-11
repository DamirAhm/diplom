// Draw all strokes on canvas
export const drawAllStrokes = async (
  canvas: HTMLCanvasElement,
  strokes: any[],
  scaleX: number,
  scaleY: number
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Используем выпуклую оболочку для рисования целых мазков
  for (const stroke of strokes) {
    await new Promise((resolve) => setTimeout(resolve));

    // Преобразуем пиксели в точки для выпуклой оболочки
    if (!stroke.pixels || stroke.pixels.length === 0) continue;

    const points = stroke.pixels.map((pixel: number[]) => ({
      x: Math.floor(pixel[0] * scaleX),
      y: Math.floor(pixel[1] * scaleY)
    }));

    // Получаем выпуклую оболочку
    let hull = computeConvexHull(points);

    // Если Hull пустой или содержит слишком мало точек, используем простой прямоугольник
    if (!hull || hull.length < 3) {
      if (points.length > 0) {
        // Найдем крайние точки для создания ограничивающего прямоугольника
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

        // Добавляем запас в 2 пикселя по краям
        hull = [
          { x: minX - 2, y: minY - 2 },
          { x: maxX + 2, y: minY - 2 },
          { x: maxX + 2, y: maxY + 2 },
          { x: minX - 2, y: maxY + 2 }
        ];
      } else {
        continue; // Пропускаем пустые мазки
      }
    } else {
      // Расширяем выпуклую оболочку на несколько пикселей
      hull = expandConvexHull(hull, 2);
    }

    // Рисуем заполненный полигон
    const [r, g, b] = stroke.color;
    ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

    ctx.beginPath();
    ctx.moveTo(hull[0].x, hull[0].y);

    for (let i = 1; i < hull.length; i++) {
      ctx.lineTo(hull[i].x, hull[i].y);
    }

    ctx.closePath();
    ctx.fill();
  }
};

// Draw all strokes on canvas using pixel-by-pixel rendering
export const drawAllStrokesPixelMode = async (
  canvas: HTMLCanvasElement,
  strokes: any[],
  scaleX: number,
  scaleY: number
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Calculate total number of pixels to determine if we should optimize rendering
  let totalPixels = 0;
  for (const stroke of strokes) {
    if (stroke.pixels && stroke.pixels.length) {
      totalPixels += stroke.pixels.length;
    }
  }

  // Determine pixel size based on total count and scale
  // For very dense pixel counts, we'll use smaller pixel sizes
  const isHighDensity = totalPixels > 100000;
  const pixelSize = isHighDensity ? 1 : Math.max(2, Math.min(scaleX, scaleY));

  // Draw each stroke pixel by pixel for maximum accuracy
  for (const stroke of strokes) {
    await new Promise((resolve) => setTimeout(resolve));

    // Check if the stroke has pixels
    if (!stroke.pixels || stroke.pixels.length === 0) continue;

    // Set fill color for all pixels in this stroke
    const [r, g, b] = stroke.color;
    ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;

    // Use an optimized drawing approach for high density pixel counts
    if (isHighDensity && stroke.pixels.length > 10000) {
      // Create an ImageData for batch rendering
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      const data = imageData.data;

      for (const pixel of stroke.pixels) {
        const x = Math.floor(pixel[0] * scaleX);
        const y = Math.floor(pixel[1] * scaleY);

        // Skip if outside canvas bounds
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue;

        const index = (y * canvas.width + x) * 4;
        // Set RGBA values
        data[index] = r;
        data[index + 1] = g;
        data[index + 2] = b;
        data[index + 3] = 255; // Fully opaque
      }

      ctx.putImageData(imageData, 0, 0);
    } else {
      // Draw each pixel individually with the determined size
      for (const pixel of stroke.pixels) {
        const x = Math.floor(pixel[0] * scaleX);
        const y = Math.floor(pixel[1] * scaleY);

        // Draw a pixel with the chosen size
        ctx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }
};

// Функция для расширения выпуклой оболочки на заданное количество пикселей
export function expandConvexHull(hull: { x: number, y: number }[], padding: number): { x: number, y: number }[] {
  if (hull.length < 3) return hull;

  const center = findPolygonCenter(hull);

  // Расширяем каждую точку от центра
  return hull.map(point => {
    // Вектор от центра к точке
    const dx = point.x - center.x;
    const dy = point.y - center.y;

    // Длина вектора
    const length = Math.sqrt(dx * dx + dy * dy);

    // Если длина слишком мала, используем стандартное направление
    if (length < 1e-10) {
      return {
        x: point.x + padding,
        y: point.y + padding
      };
    }

    // Нормализованный вектор
    const nx = dx / length;
    const ny = dy / length;

    // Расширенная точка
    return {
      x: point.x + nx,
      y: point.y + ny
    };
  });
}

// Находит центр многоугольника
function findPolygonCenter(points: { x: number, y: number }[]): { x: number, y: number } {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }

  let sumX = 0;
  let sumY = 0;

  for (const point of points) {
    sumX += point.x;
    sumY += point.y;
  }

  return {
    x: sumX / points.length,
    y: sumY / points.length
  };
}

// Helper function for convex hull calculation
export function computeConvexHull(points: { x: number, y: number }[]): { x: number, y: number }[] {
  if (points.length <= 3) return points;

  // Sort points by x-coord (and by y-coord if tied)
  points.sort((a, b) => {
    if (a.x === b.x) return a.y - b.y;
    return a.x - b.x;
  });

  // Build lower hull
  const lower = [];
  for (let i = 0; i < points.length; i++) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], points[i]) <= 0
    ) {
      lower.pop();
    }
    lower.push(points[i]);
  }

  // Build upper hull
  const upper = [];
  for (let i = points.length - 1; i >= 0; i--) {
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], points[i]) <= 0
    ) {
      upper.pop();
    }
    upper.push(points[i]);
  }

  // Remove duplicate endpoints
  upper.pop();
  lower.pop();

  return lower.concat(upper);
}

// Cross product for convex hull calculation
export function crossProduct(o: { x: number, y: number }, a: { x: number, y: number }, b: { x: number, y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// Draw borders of superpixels on a separate layer
export const drawBorders = async (
  canvas: HTMLCanvasElement,
  strokes: any[],
  scaleX: number,
  scaleY: number,
) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 0.6;

  for (const stroke of strokes) {
    await new Promise((resolve) => setTimeout(resolve));

    if (stroke.pixels.length < 2) continue;

    const points = stroke.pixels.map((pixel: number[]) => ({
      x: Math.floor(pixel[0] * scaleX),
      y: Math.floor(pixel[1] * scaleY),
    }));

    // Получаем выпуклую оболочку
    let hull = computeConvexHull(points);

    // Расширяем выпуклую оболочку на 2 пикселя
    if (hull.length >= 3) {
      hull = expandConvexHull(hull, 2);
    } else if (points.length > 0) {
      // Для маленьких мазков создаем прямоугольник с запасом
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

      hull = [
        { x: minX - 2, y: minY - 2 },
        { x: maxX + 2, y: minY - 2 },
        { x: maxX + 2, y: maxY + 2 },
        { x: minX - 2, y: maxY + 2 }
      ];
    }

    if (hull.length > 2) {
      ctx.beginPath();
      ctx.moveTo(hull[0].x, hull[0].y);

      for (let i = 1; i < hull.length; i++) {
        ctx.lineTo(hull[i].x, hull[i].y);
      }

      ctx.closePath();
      ctx.stroke();
    }
  }
};

// WebGL шейдеры для вычисления градиентов изображения
const vertexShaderSource = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  
  varying vec2 v_texCoord;
  
  void main() {
    gl_Position = vec4(a_position, 0, 1);
    v_texCoord = a_texCoord;
  }
`;

const fragmentShaderSource = `
  precision mediump float;
  
  uniform sampler2D u_image;
  uniform vec2 u_textureSize;
  uniform float u_sensitivity;
  
  varying vec2 v_texCoord;
  
  // Конвертирует RGB в градации серого
  float rgb2gray(vec4 color) {
    return 0.2126 * color.r + 0.7152 * color.g + 0.0722 * color.b;
  }
  
  void main() {
    // Размер одного пикселя в текстурных координатах
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    
    // Получаем значения соседних пикселей для расчета градиента по Собелю
    float topLeft = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)));
    float top = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(0, -1)));
    float topRight = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(1, -1)));
    float left = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(-1, 0)));
    float right = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(1, 0)));
    float bottomLeft = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(-1, 1)));
    float bottom = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(0, 1)));
    float bottomRight = rgb2gray(texture2D(u_image, v_texCoord + onePixel * vec2(1, 1)));
    
    // Вычисляем градиент по ядру Собеля
    float dx = -1.0 * topLeft + -2.0 * left + -1.0 * bottomLeft + 
               1.0 * topRight + 2.0 * right + 1.0 * bottomRight;
    float dy = -1.0 * topLeft + -2.0 * top + -1.0 * topRight + 
               1.0 * bottomLeft + 2.0 * bottom + 1.0 * bottomRight;
    
    // Нормализуем и применяем чувствительность
    float gradientMagnitude = sqrt(dx * dx + dy * dy);
    
    // Применяем чувствительность
    float adjusted = pow(gradientMagnitude, 1.0 / u_sensitivity);
    float normalizedValue = clamp(adjusted, 0.0, 1.0);
    
    // Вибрантная тепловая карта
    vec3 color;
    if (normalizedValue < 0.33) {
      // Магента -> Желтый (низкие к средне-низким)
      float t = normalizedValue * 3.0;
      color = vec3(1.0, t, 1.0 - t);
    } else if (normalizedValue < 0.66) {
      // Желтый -> Белый (средне-низкие к средне-высоким)
      float t = (normalizedValue - 0.33) * 3.0;
      color = vec3(1.0, 1.0, t);
    } else {
      // Белый -> Голубой (средне-высокие к высоким)
      float t = (normalizedValue - 0.66) * 3.0;
      color = vec3(1.0 - t, 1.0, 1.0);
    }
    
    gl_FragColor = vec4(color, 0.8);
  }
`;

// Компиляция шейдера
function compileShader(gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Failed to create shader');

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    throw new Error('Failed to compile shader');
  }

  return shader;
}

// Создание программы WebGL
function createProgram(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader): WebGLProgram {
  const program = gl.createProgram();
  if (!program) throw new Error('Failed to create program');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program linking error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    throw new Error('Failed to link program');
  }

  return program;
}

// Генерация градиента с помощью WebGL
export const generateGradientWithWebGL = (
  originalCanvas: HTMLCanvasElement,
  targetCanvas: HTMLCanvasElement,
  sensitivity: number = 1.0
): boolean => {
  const gl = targetCanvas.getContext('webgl', { premultipliedAlpha: false });
  if (!gl) {
    console.error('WebGL not supported');
    return false;
  }

  try {
    // Установка размеров канваса
    targetCanvas.width = originalCanvas.width;
    targetCanvas.height = originalCanvas.height;
    gl.viewport(0, 0, targetCanvas.width, targetCanvas.height);

    // Компиляция шейдеров
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
    const program = createProgram(gl, vertexShader, fragmentShader);

    // Настройка координат вершин и текстурных координат
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1.0, -1.0,
      1.0, -1.0,
      -1.0, 1.0,
      1.0, 1.0
    ]), gl.STATIC_DRAW);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0.0, 1.0,
      1.0, 1.0,
      0.0, 0.0,
      1.0, 0.0
    ]), gl.STATIC_DRAW);

    // Создание текстуры из исходного изображения
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, originalCanvas);

    // Использование программы
    gl.useProgram(program);

    // Настройка атрибутов и uniform-переменных
    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    // Установка uniform-переменных
    const textureLocation = gl.getUniformLocation(program, 'u_image');
    const textureSizeLocation = gl.getUniformLocation(program, 'u_textureSize');
    const sensitivityLocation = gl.getUniformLocation(program, 'u_sensitivity');

    gl.uniform1i(textureLocation, 0);
    gl.uniform2f(textureSizeLocation, originalCanvas.width, originalCanvas.height);
    gl.uniform1f(sensitivityLocation, sensitivity);

    // Отрисовка
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    return true;
  } catch (error) {
    console.error('WebGL gradient generation error:', error);
    return false;
  }
};

// Update gradients view based on checkbox states
export const updateGradientsView = (
  strokeData: any,
  originalCanvasRef: React.RefObject<HTMLCanvasElement>,
  gradientsCanvasRef: React.RefObject<HTMLCanvasElement>,
  showGradients: boolean,
  showCenters: boolean,
  showColorGradient: boolean,
  gradientSensitivity: number,
  drawGradientVectors: (ctx: CanvasRenderingContext2D, vectors: any[], scaleX: number, scaleY: number) => void,
  drawClusterCenters: (ctx: CanvasRenderingContext2D, strokes: any[], scaleX: number, scaleY: number) => void
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
    drawGradientVectors(ctx, strokeData.gridVectors, scaleX, scaleY);
    ctx.restore();
  }

  // Draw cluster centers if enabled
  if (showCenters && strokeData.strokes) {
    ctx.save();
    // Вычисляем масштаб отображения
    const scaleX = gradientsCanvasRef.current.width / strokeData.imageWidth;
    const scaleY = gradientsCanvasRef.current.height / strokeData.imageHeight;
    drawClusterCenters(ctx, strokeData.strokes, scaleX, scaleY);
    ctx.restore();
  }
};

// Draw gradient vectors
export const drawGradientVectors = (
  ctx: CanvasRenderingContext2D,
  vectors: any[],
  scaleX: number,
  scaleY: number
) => {
  // Рисуем вектора напрямую без предварительной отрисовки оригинального изображения
  // Это избавит от перекрытия канвасов

  console.log("drawGradientVectors", vectors);

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

// Draw cluster centers
export const drawClusterCenters = (
  ctx: CanvasRenderingContext2D,
  strokes: any[],
  scaleX: number,
  scaleY: number
) => {
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
      const gradientX = Math.min(
        Math.floor(x / scaleFactorX),
        gradientData[0].length - 1
      );
      const gradientY = Math.min(
        Math.floor(y / scaleFactorY),
        gradientData.length - 1
      );

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
};
