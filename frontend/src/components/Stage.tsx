// Stage.tsx
import { GridPlane } from '@/components/GridPlane';
import {
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Text,
} from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Cylinder } from './cylinder'; // Ensure correct import path
import { animated, useSpring } from '@react-spring/three'; // If needed

const height = 3.5;

// Font Properties
const fontProps = {
  font: './Inter-Bold.woff',
  fontSize: 1.2,
  letterSpacing: -0.05,
  lineHeight: 1,
  'material-toneMapped': false,
};

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
    orthoCam.current.lookAt(0, 0, 0);
  }, [cameraView]);

  // Flatten the position matrix into an array of dancer positions
  const dancerPositions = [];
  if (positions && positions.length > 0) {
    for (let y = 0; y < positions.length; y++) {
      for (let x = 0; x < positions[y].length; x++) {
        const dancerNum = positions[y][x];
        if (dancerNum !== 0) {
          dancerPositions.push({
            x,
            y,
            dancerNum,
          });
        }
      }
    }
  }

  return (
    <Canvas>
      {/* Camera */}
      {cameraView ? (
        <>
          <PerspectiveCamera makeDefault position={[0, 20, 50]} fov={30} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={100}
            target={[0, 0, 0]}
          />
        </>
      ) : (
        <>
          <OrthographicCamera
            makeDefault
            zoom={30}
            position={[0, 5, 0]}
            ref={orthoCam}
          />
          {/* Optionally add controls for orthographic camera */}
        </>
      )}
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

      {/* Cylinders with Smooth Transitions */}
      {dancerPositions.map((dancer) => (
        <Cylinder
          position={[
            (dancer.x - width / 2) * size,
            height / 2,
            (dancer.y - depth / 2) * size,
          ]}
          label={dancer.dancerNum.toString()}
          cameraView={cameraView}
          key={dancer.dancerNum} // Ensure unique key
        />
      ))}
    </Canvas>
  );
}
