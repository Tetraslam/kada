import React, { useLayoutEffect, useRef } from 'react';
import { PlaneGeometry, MeshStandardMaterial, Vector3 } from 'three';

function Line({ start, end }: { start: number[]; end: number[] }) {
  const ref = useRef<any>();
  useLayoutEffect(() => {
    ref.current?.geometry.setFromPoints(
      [start, end].map((point) => new Vector3(...point)),
    );
  }, [start, end]);
  return (
    <line ref={ref}>
      <bufferGeometry />
      <lineBasicMaterial color="#606060" />
    </line>
  );
}

export const GridPlane = ({
  width,
  depth,
  size,
}: {
  width: number;
  depth: number;
  size: number;
}) => {
  return (
    <mesh position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[width * size, depth * size, 1, 1]} />
        <meshStandardMaterial color="#333036" />
      </mesh>
      {/* <gridHelper args={[20, 10, 0xffffff, 0x808080]} /> */}

      {[...Array(depth + 1)].map((_, i) => {
        const z = (i - depth / 2) * size;
        return (
          <Line
            start={[(-width / 2) * size, 0, z]}
            end={[(width / 2) * size, 0, z]}
            key={i}
          />
        );
      })}
      {[...Array(width + 1)].map((_, i) => {
        const x = (i - width / 2) * size;
        return (
          <Line
            start={[x, 0, (depth / 2) * size]}
            end={[x, 0, -(depth / 2) * size]}
            key={i}
          />
        );
      })}
    </mesh>
  );
};
