export interface SuperpixelParams {
    numberOfSuperpixels: number;
    compactnessFactor: number;
    elongation: number;
    iterations: number;
    gridSize: number;
    adaptiveFactor: number;
}

export interface SuperpixelResponse {
    imageWidth: number;
    imageHeight: number;
    strokes: StrokeData[];
    gridVectors: GridVector[];
    gradientDebug: number[][];
}

export interface StrokeData {
    width: number;
    height: number;
    centers: Array<[number, number]>;
    pixels: number[][];
    stroke: Array<{
        centerId: number;
        points: Array<[number, number]>;
    }>;
    adjacencyList: { [key: number]: number[] };
    gradientMagnitude: number[][];
    gradientDirection: number[][];
}

export interface GridVector {
    x: number;
    y: number;
    theta: number;
    length: number;
}

export interface Point {
    x: number;
    y: number;
}

export interface CanvasRefs {
    originalCanvasRef: React.RefObject<HTMLCanvasElement>;
    superpixelCanvasRef: React.RefObject<HTMLCanvasElement>;
    gradientsCanvasRef: React.RefObject<HTMLCanvasElement>;
}

export type DrawFunction = (
    ctx: CanvasRenderingContext2D,
    strokeData: StrokeData,
    options?: {
        drawCenters?: boolean;
        drawBorders?: boolean;
        useGradientColors?: boolean;
        gradientSensitivity?: number;
    }
) => void; 