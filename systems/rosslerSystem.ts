import { System } from "./types";

const calculateRosslerPoints = (
  [a, b, c]: number[],
  [initialX, initialY, initialZ]: number[],
  time: number,
  dt: number,
) => {
  let points = [initialX, initialY, initialZ];
  let x = initialX;
  let y = initialY;
  let z = initialZ;

  const numPoints = Math.floor(time / dt);

  for (let i = 0; i < numPoints; i++) {
    const dx = (-y - z) * dt;
    const dy = (x + a * y) * dt;
    const dz = (b + z * (x - c)) * dt;

    x += dx;
    y += dy;
    z += dz;

    points.push(x, y, z);
  }

  return points;
};

export const RosslerSystem: System = {
  name: "rossler",
  label: {
    en: "Rossler",
    ru: "Рёсслер",
  },
  params: [
    {
      name: "a",
      defaultValue: 0.2,
      min: 0,
      max: 0.3,
    },
    {
      name: "b",
      defaultValue: 0.2,
      min: 0,
      max: 1,
    },
    {
      name: "c",
      defaultValue: 5.7,
      min: 4,
      max: 8,
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
  scale: 2,
  systemFunc: calculateRosslerPoints,
};
