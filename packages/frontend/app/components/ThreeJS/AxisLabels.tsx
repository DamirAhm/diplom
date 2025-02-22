import { useEffect, useRef, useState } from "react";
import { Text } from "@react-three/drei";
import type React from "react"; // Added import for React
import { useFrame, useThree } from "@react-three/fiber";
import { Quaternion } from "three";

interface AxisLabelsProps {
  size: number;
}

const AxisLabels: React.FC<AxisLabelsProps> = ({ size }) => {
  const { camera } = useThree();
  const [quaternion, setQuaternion] = useState(camera.quaternion);

  useFrame(() => {
    if (
      !(
        quaternion.x === camera.quaternion.x &&
        quaternion.y === camera.quaternion.y &&
        quaternion.y === camera.quaternion.z &&
        quaternion.y === camera.quaternion.w
      )
    ) {
      setQuaternion(
        new Quaternion(
          camera.quaternion.x,
          camera.quaternion.y,
          camera.quaternion.z,
          camera.quaternion.w,
        ),
      );
    }
  });

  return (
    <>
      <Text
        position={[size + 2, 0, 0]}
        quaternion={quaternion}
        color="red"
        fontSize={4}
      >
        X
      </Text>
      <Text
        position={[0, size + 2, 0]}
        quaternion={quaternion}
        color="green"
        fontSize={4}
      >
        Y
      </Text>
      <Text
        position={[0, 0, size + 2]}
        quaternion={quaternion}
        color="blue"
        fontSize={4}
      >
        Z
      </Text>
    </>
  );
};

export default AxisLabels;
