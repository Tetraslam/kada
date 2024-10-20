'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import './globals.css';
import { GridPlane } from '@/components/GridPlane';

function Cylinder(props: any) {
  // This reference will give us direct access to the mesh
  const meshRef: any = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);
  const [active, setActive] = useState(false);

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {});

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <mesh
      {...props}
      ref={meshRef}
      scale={active ? 1.5 : 1}
      onPointerOver={(e) => setHover(true)}
      onPointerOut={(e) => setHover(false)}
    >
      <cylinderGeometry args={[0.8, 0.8, 2.4, 32]} />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />
    </mesh>
  );
}

//@ts-ignore
export default function Page() {
  return (
    <Canvas>
      {/* Camera */}
      <PerspectiveCamera makeDefault position={[0, 0, 20]} />
      <OrbitControls
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - Math.PI / 16}
        dampingFactor={0.1}
        minDistance={20}
        maxDistance={100}
      />

      {/* Lighting */}
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[10, 10, 10]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={Math.PI}
      />
      <pointLight position={[-10, -10, -10]} decay={0} intensity={Math.PI} />

      {/* Background */}
      <color attach="background" args={['#26222a']} />

      {/* Floor */}
      <GridPlane />

      {/* Cylinders */}
      <Cylinder position={[-1, 1.2, 1]} />
      <Cylinder position={[1, 1.2, -1]} />
    </Canvas>
  );
}
