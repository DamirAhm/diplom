import useEventCallback from "@/hooks/use-event-callback";
import { debounce } from "@/lib/debounce";
import { System } from "@/systems/types";
import { useEffect, useMemo, useState } from "react";

type Params = {
  system: System;
  params: number[];
  init: number[];
  time: number;
  dt: number;
};

export const SystemPlot: React.FC<Params> = ({
  system,
  params,
  init,
  time,
  dt,
}) => {
  const [points, setPoints] = useState<number[]>([]);
  const debounced = useEventCallback(
    debounce(() => {
      setPoints(system.systemFunc(params, init, time, dt));
    }, 300),
  );

  useEffect(() => {
    debounced();
  }, [system, params, init, time, dt]);

  const BUCKET_SIZE = 60_000;

  const numBuckets = Math.ceil(points.length / 60_000);

  const buckets = Array.from({ length: numBuckets }, (_, i) =>
    points.slice(i * BUCKET_SIZE, (i + 1) * BUCKET_SIZE),
  );

  const groupKey =
    system.name +
    params.join("-") +
    init.join("-") +
    time.toString() +
    dt.toString();

  return (
    <group key={groupKey} scale={system.scale}>
      {buckets.map((bucket, i) => (
        <line key={groupKey + i.toString()}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={bucket.length / 3}
              array={new Float32Array(bucket)}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00aaff" linewidth={2} />
        </line>
      ))}
    </group>
  );
};
