import { GridPlane } from '@/components/GridPlane';
import {
  Billboard,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Text,
} from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

const height = 3.5;

// Font
const fontProps = {
  font: './Inter-Bold.woff',
  fontSize: 1.2,
  letterSpacing: -0.05,
  lineHeight: 1,
  'material-toneMapped': false,
};

function Cylinder({
  position,
  label,
  cameraView, // perspective vs orthographic
}: {
  position: [number, number, number];
  label?: string;
  cameraView: boolean;
}) {
  // This reference will give us direct access to the mesh
  const meshRef: any = useRef();

  // Set up state for the hovered and active state
  const [hovered, setHover] = useState(false);

  // Subscribe this component to the render-loop, rotate the mesh every frame
  useFrame((state, delta) => {});

  // Return view, these are regular three.js elements expressed in JSX
  return (
    <>
      <mesh
        position={position}
        ref={meshRef}
        onPointerOver={(e) => setHover(true)}
        onPointerOut={(e) => setHover(false)}
      >
        <cylinderGeometry args={[0.8, 0.8, height, 32]} />
        <meshStandardMaterial color={hovered ? 'orange' : 'hotpink'} />

        <Text
          {...fontProps}
          characters="0123456789"
          rotation={cameraView ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
          position={cameraView ? [0, 0, 0.8] : [0, height / 2 + 0.01, 0]}
        >
          {label}
        </Text>
      </mesh>
    </>
  );
}

export default function Stage({
  positions,
  cameraView,
}: {
  positions: number[][];
  cameraView: boolean;
}) {
  const orthoCam: any = useRef();

  useEffect(() => {
    if (!orthoCam.current) return;
    orthoCam.current?.lookAt(0, 0, 0);
  }, [orthoCam.current, cameraView]);

  return (
    <Canvas>
      {/* Camera */}
      <PerspectiveCamera makeDefault={cameraView} position={[0, 0, 20]} />
      <OrbitControls
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - Math.PI / 16}
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={100}
        enabled={cameraView}
        target={[0, 0, 0]}
      />
      <OrthographicCamera
        makeDefault={!cameraView}
        zoom={20}
        position={[0, 5, 0]}
        ref={orthoCam}
      />

      {/* Lighting */}
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[30, 10, 30]}
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

      {/* Text label for stage directions */}
      <Text
        {...fontProps}
        position={[0, 0, 20]}
        rotation={[cameraView ? 0 : -Math.PI / 2, 0, 0]}
        color={'#a0a0a0'}
      >
        Front
      </Text>
      <Text
        {...fontProps}
        position={[0, height / 2, -20]}
        rotation={[cameraView ? 0 : -Math.PI / 2, 0, 0]}
        color={'#a0a0a0'}
      >
        Back
      </Text>

      {/* Cylinders */}
      {positions.map((pos, i) => {
        return (
          <Cylinder
            position={[pos[0] * 2, height / 2, pos[1] * 2]}
            label={i.toString()}
            cameraView={cameraView}
            key={i}
          />
        );
      })}
    </Canvas>
  );
}
