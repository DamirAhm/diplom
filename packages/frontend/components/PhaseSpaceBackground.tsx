"use client";

import { useEffect, useRef } from 'react';

interface PhaseSpaceBackgroundProps {
    colorScheme?: 'primary' | 'secondary' | 'accent';
    opacity?: number;
    complexity?: 'low' | 'medium' | 'high';
}

const SIMULATION_SETTINGS = {
    defaultScale: 0.03,
    maxScale: 0.01,
    minScale: -0.01,
    maxFadeSpeed: 4e-4,
}

const PhaseSpaceBackground: React.FC<PhaseSpaceBackgroundProps> = ({
    colorScheme = 'primary',
    opacity = 0.15,
    complexity = 'high'
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const requestIdRef = useRef<number>();
    const pointsRef = useRef<Array<{
        x: number;
        y: number;
        vx: number;
        vy: number;
        age: number;
        maxAge: number;
        history: Array<{ x: number, y: number }>;
        colorIndex: number;
    }>>([]);


    const complexitySettings = {
        low: { points: 80, historyLength: 30, fadeSpeed: 0.03 },
        medium: { points: 120, historyLength: 50, fadeSpeed: 0.02 },
        high: { points: 200, historyLength: 50, fadeSpeed: 0.015 }
    };

    const settings = complexitySettings[complexity];


    const colorSchemes = {
        primary: [
            'rgba(79, 70, 229, 0.9)',
            'rgba(99, 102, 241, 0.9)',
            'rgba(129, 140, 248, 0.9)',
            'rgba(165, 180, 252, 0.9)'
        ],
        secondary: [
            'rgba(6, 182, 212, 0.9)',
            'rgba(20, 184, 166, 0.9)',
            'rgba(45, 212, 191, 0.9)',
            'rgba(94, 234, 212, 0.9)'
        ],
        accent: [
            'rgba(244, 63, 94, 0.9)',
            'rgba(251, 113, 133, 0.9)',
            'rgba(253, 164, 175, 0.9)',
            'rgba(255, 228, 230, 0.9)'
        ]
    };

    const PARAMS = {
        sigma: 10,
        beta: 8 / 3,
        rho: 25,
        scale: SIMULATION_SETTINGS.defaultScale,
    };

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx) return;

            const resizeCanvas = () => {
                const { width, height } = canvas.getBoundingClientRect();
                if (canvas.width !== width || canvas.height !== height) {
                    canvas.width = width;
                    canvas.height = height;
                    initializePoints();
                }
            };

            const initializePoints = () => {
                pointsRef.current = [];
                for (let i = 0; i < settings.points; i++) {
                    pointsRef.current.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        age: 0,
                        maxAge: 200 + Math.random() * 300,
                        history: [],
                        colorIndex: Math.floor(Math.random() * colorSchemes[colorScheme].length)
                    });
                }
            };

            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);
            initializePoints();

            const animate = () => {
                PARAMS.scale = Math.min(
                    Math.max(
                        SIMULATION_SETTINGS.minScale,
                        PARAMS.scale + Math.random() * SIMULATION_SETTINGS.maxFadeSpeed - SIMULATION_SETTINGS.maxFadeSpeed / 2
                    ),
                    SIMULATION_SETTINGS.maxScale
                );

                if (!canvasRef.current || !ctx) return;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const width = canvas.width;
                const height = canvas.height;
                const centerX = width / 2;
                const centerY = height / 2;

                pointsRef.current.forEach((point, idx) => {
                    const normalizedX = (point.x - centerX) / (width / 4);
                    const normalizedY = (point.y - centerY) / (height / 4);
                    const normalizedZ = 1;

                    let dx = PARAMS.sigma * (normalizedY - normalizedX);
                    let dy = normalizedX * (PARAMS.rho - normalizedZ) - normalizedY;

                    point.vx += dx * PARAMS.scale;
                    point.vy += dy * PARAMS.scale;

                    point.vx *= 0.99;
                    point.vy *= 0.99;

                    point.x += point.vx;
                    point.y += point.vy;

                    point.history.push({ x: point.x, y: point.y });

                    if (point.history.length > settings.historyLength) {
                        point.history.shift();
                    }

                    point.age++;

                    if (point.age > point.maxAge ||
                        point.x < -width * 0.1 ||
                        point.x > width * 1.1 ||
                        point.y < -height * 0.1 ||
                        point.y > height * 1.1) {

                        let spawnX = 0;
                        let spawnY = 0;
                        const side = Math.floor(Math.random() * 4);

                        switch (side) {
                            case 0:
                                spawnX = Math.random() * width;
                                spawnY = -20;
                                break;
                            case 1:
                                spawnX = width + 20;
                                spawnY = Math.random() * height;
                                break;
                            case 2:
                                spawnX = Math.random() * width;
                                spawnY = height + 20;
                                break;
                            case 3:
                                spawnX = -20;
                                spawnY = Math.random() * height;
                                break;
                        }

                        pointsRef.current[idx] = {
                            x: spawnX,
                            y: spawnY,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: (Math.random() - 0.5) * 0.5,
                            age: 0,
                            maxAge: 200 + Math.random() * 300,
                            history: [],
                            colorIndex: Math.floor(Math.random() * colorSchemes[colorScheme].length)
                        };
                        return;
                    }

                    if (point.history.length > 2) {
                        const colors = colorSchemes[colorScheme];
                        const baseColor = colors[point.colorIndex];

                        for (let i = 1; i < point.history.length; i++) {
                            const prev = point.history[i - 1];
                            const curr = point.history[i];

                            const ageRatio = i / point.history.length;
                            const opacity = ageRatio * 0.5;

                            ctx.beginPath();
                            ctx.moveTo(prev.x, prev.y);
                            ctx.lineTo(curr.x, curr.y);

                            const lineWidth = 0.8 + ageRatio * 1.2;
                            ctx.lineWidth = lineWidth;

                            ctx.strokeStyle = baseColor.replace(/[\d\.]+\)$/, `${opacity})`);
                            ctx.stroke();
                        }
                    }
                });

                requestIdRef.current = requestAnimationFrame(animate);
            };

            requestIdRef.current = requestAnimationFrame(animate);

            return () => {
                window.removeEventListener('resize', resizeCanvas);
                if (requestIdRef.current) {
                    cancelAnimationFrame(requestIdRef.current);
                }
            };
        }
    }, [colorScheme, complexity, settings]);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
        />
    );
};

export default PhaseSpaceBackground; 