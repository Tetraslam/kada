import { GridPlane } from '@/components/GridPlane';
import {
  Billboard,
  OrbitControls,
  PerspectiveCamera,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';

function Cylinder({
  position,
  label,
}: {
  position: [number, number, number];
  label?: string;
}) {
  // This reference will give us direct access to the mesh
  const meshRef: any = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {});

  // Font
  const fontProps = {
    font: './Inter-Bold.woff',
    fontSize: 1.2,
    letterSpacing: -0.05,
    lineHeight: 1,
    'material-toneMapped': false,
  };

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <>
      <mesh
        position={position}
        ref={meshRef}
        onPointerOver={(e) => setHover(true)}
        onPointerOut={(e) => setHover(false)}
      >
        <cylinderGeometry args={[0.8, 0.8, 2.4, 32]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : 'orange'} />

        <Text
          {...fontProps}
          characters="0123456789"
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 1.21, 0]}
        >
          {label}
        </Text>
        <Text {...fontProps} characters="0123456789" position={[0, 0, 0.8]}>
          {label}
        </Text>
      </mesh>
    </>
  );
}

export default function Stage({ positions }: { positions: number[][] }) {
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
      {positions.map((pos, i) => {
        return (
          <Cylinder
            position={[pos[0] * 2, 1.2, pos[1] * 2]}
            label={i.toString()}
            key={i}
          />
        );
      })}
    </Canvas>
  );
}
