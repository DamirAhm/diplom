import { System } from "./types";

const calculateLorenzPoints = (
  [sigma, rho, beta]: number[],
  [initialX, initialY, initialZ]: number[],
  time: number,
  dt: number,
) => {
  const points = [initialX, initialY, initialZ];
  let x = initialX;
  let y = initialY;
  let z = initialZ;
  const numPoints = Math.floor(time / dt);

  for (let i = 0; i < numPoints; i++) {
    const dx = sigma * (y - x) * dt;
    const dy = (x * (rho - z) - y) * dt;
    const dz = (x * y - beta * z) * dt;

    x += dx;
    y += dy;
    z += dz;

    points.push(x, y, z);
  }

  return points;
};

export const LorenzSystem: System = {
  name: "lorenz",
  label: {
    en: "Lorenz",
    ru: "Лоренц",
  },
  params: [
    {
      name: "σ",
      defaultValue: 10,
      min: 0,
      max: 40,
    },
    {
      name: "ρ",
      defaultValue: 28,
      min: 0,
      max: 50,
    },
    {
      name: "β",
      defaultValue: 2.67,
      min: 0,
      max: 5,
    },
  ],
  stateVaribles: [
    {
      name: "x",
      defaultValue: 0.1,
      min: 0,
      max: 1,
    },
    {
      name: "y",
      defaultValue: 0,
      min: 0,
      max: 1,
    },
    {
      name: "z",
      defaultValue: 0,
      min: 0,
      max: 1,
    },
  ],
  scale: 0.5,
  systemFunc: calculateLorenzPoints,
};
