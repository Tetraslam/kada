'use client';

import Stage from '@/components/Stage';
import './globals.css';
import { useCallback, useEffect, useState } from 'react';
import { Camera, CirclePlay, Download, Gauge, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

export default function Page() {
  const [positions, setPositions] = useState([
    [0, 1],
    [1, 0],
    [-1, 0],
    [-2, -1],
    [2, -1],
  ]);
  const [cameraView, setCameraView] = useState<boolean>(true);
  const [signedVideoUrl, setSignedVideoUrl] = useState('');

  const keyHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'c') {
        console.log('changing value of cameraview...');
        setCameraView((x) => !x);
      }
    },
    [cameraView],
  );

  useEffect(() => {
    (async () => {
      if (signedVideoUrl) return;

      // Get signed Supabase URL for video playback
      setSignedVideoUrl(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/video/armageddon.mp4`,
      );
    })();

    // Keybinds
    if (!setCameraView) return;
    window.addEventListener('keydown', keyHandler, true);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [setCameraView]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#26222a]">
      {/* Stage */}
      <Stage positions={positions} cameraView={cameraView} />

      {/* Dance title, artist */}
      <div className="absolute left-0 top-0 m-6 select-none text-white">
        <p className="text-3xl font-black">Armageddon</p>
        <p>AESPA</p>
      </div>

      {/* Video */}
      <div className="absolute right-0 top-0 m-6 aspect-video w-80 overflow-hidden rounded-md">
        <video src={signedVideoUrl} className="h-full w-full" />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 flex w-full items-center gap-4 rounded-lg px-10 py-6 text-pink-400 backdrop-blur-sm">
        <button>
          <Gauge />
        </button>
        <button>
          <CirclePlay />
        </button>
        <button onClick={() => setCameraView((x) => !x)}>
          <Camera />
        </button>

        <p className="whitespace-pre">00:00 / 00:00</p>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-600">
          <div className="h-full w-1/2 rounded-full bg-pink-400"></div>
        </div>

        {/* Upload */}
        <button>
          <Upload />
        </button>
        <button>
          <Download />
        </button>
      </div>
    </div>
  );
}
