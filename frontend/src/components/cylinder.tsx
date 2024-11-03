// Cylinder.tsx
import { Text } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import { useEffect } from 'react';

const height = 3.5;

// Font Properties
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
  cameraView,
}: {
  position: [number, number, number];
  label?: string;
  cameraView: boolean;
}) {
  // Define the spring for position
  const props = useSpring({
    position: position,
    config: {
      tension: 300, // Higher tension for quicker movement
      friction: 20, // Lower friction for smoother motion
    },
  });

  return (
    <animated.mesh position={props.position}>
      <cylinderGeometry args={[0.8, 0.8, height, 64]} />
      <meshStandardMaterial color={'#f472b6'} />

      <Text
        {...fontProps}
        characters="0123456789"
        rotation={cameraView ? [0, 0, 0] : [-Math.PI / 2, 0, 0]}
        position={cameraView ? [0, 0, 0.81] : [0, height / 2 + 0.01, 0]}
      >
        {label}
      </Text>
    </animated.mesh>
  );
}

export { Cylinder };
