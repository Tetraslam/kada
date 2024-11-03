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
        <cylinderGeometry args={[0.8, 0.8, height, 64]} />
        <meshStandardMaterial color={false ? 'orange' : '#f472b6'} />

        <Text
          {...fontProps}
          characters="0123456789"
          rotation={cameraView ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
          position={cameraView ? [0, 0, 0.81] : [0, height / 2 + 0.01, 0]}
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
  width,
  depth,
  size,
}: {
  positions: number[][];
  cameraView: boolean;
  width: number;
  depth: number;
  size: number;
}) {
  const orthoCam: any = useRef();

  useEffect(() => {
    if (!orthoCam.current) return;
    orthoCam.current?.lookAt(0, 0, 0);
  }, [orthoCam.current, cameraView]);

  return (
    <Canvas>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault={cameraView}
        position={[0, 0, 50]}
        fov={30}
      />
      <OrbitControls
        minAzimuthAngle={-Math.PI / 2}
        maxAzimuthAngle={Math.PI / 2}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2 - Math.PI / 16}
        dampingFactor={0.1}
        minDistance={10}
        maxDistance={100}
        enabled={cameraView}
        target={[0, 1, 0]}
      />
      <OrthographicCamera
        makeDefault={!cameraView}
        zoom={30}
        position={[0, 5, 0]}
        ref={orthoCam}
      />

      {/* Lighting */}
      <ambientLight intensity={Math.PI / 2} />
      <spotLight
        position={[30, 20, 30]}
        angle={0.15}
        penumbra={1}
        decay={0}
        intensity={2}
      />
      <pointLight position={[0, 10, -10]} decay={0} intensity={0} />

      {/* Background */}
      <color attach="background" args={['#26222a']} />

      {/* Floor */}
      <GridPlane width={width} depth={depth} size={size} />

      {/* Text label for stage directions */}
      <Text
        {...fontProps}
        position={[0, 0, (depth / 2 + 0.5) * size]}
        rotation={[cameraView ? 0 : -Math.PI / 2, 0, 0]}
        color={'#a0a0a0'}
      >
        Front
      </Text>
      <Text
        {...fontProps}
        position={[0, size / 2, (-depth / 2 - 0.5) * size]}
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
