'use client';

import Stage from '@/components/Stage';
import './globals.css';
import { useState } from 'react';

export default function Page() {
  const [positions, setPositions] = useState([
    [0, 0],
    [1, 1],
  ]);

  return <Stage positions={positions} />;
}
