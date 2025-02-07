import { useEffect, useRef } from "react";
import * as THREE from "three";

export const Axes = ({ size = 10 }) => {
  const ref = useRef<THREE.Group>(null);

  useEffect(() => {
    if (ref.current) {
      const axesHelper = new THREE.AxesHelper(size);
      ref.current.add(axesHelper);
    }
  }, [size]);

  return <group ref={ref} />;
};
