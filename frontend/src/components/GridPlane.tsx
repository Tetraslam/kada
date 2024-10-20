import React from 'react';
import { PlaneGeometry, MeshStandardMaterial } from 'three';

export const GridPlane = ({ size = 100, divisions = 10 }) => {
  const geometry = new PlaneGeometry(size, size);
  const material = new MeshStandardMaterial({ color: '#808080' });

  const gridMaterial = new MeshStandardMaterial({
    color: '#FFFFFF',
    wireframe: true,
    opacity: 0.5,
    transparent: true,
  });

  return (
    <mesh position={[0, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[52, 52, 1, 1]} />
        <meshStandardMaterial color="#333036" />
      </mesh>
      <gridHelper args={[52, 26, 0xffffff, 0x808080]} />
    </mesh>
  );
};
