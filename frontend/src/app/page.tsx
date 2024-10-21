'use client';

import Stage from '@/components/Stage';
import './globals.css';
import { useState } from 'react';
import { CirclePlay, Download, Gauge, Upload } from 'lucide-react';

export default function Page() {
  const [positions, setPositions] = useState([
    [0, 1],
    [1, 0],
    [-1, 0],
    [-2, -1],
    [2, -1],
  ]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#26222a]">
      {/* Stage */}
      <Stage positions={positions} />
      {/* UI elements */}

      {/* Dance title, artist */}
      <div className="absolute left-0 top-0 m-6 select-none text-white">
        <p className="text-3xl font-black">Armageddon</p>
        <p>AESPA</p>
      </div>

      {/* Video */}
      <div className="absolute right-0 top-0 m-6 aspect-video w-60 overflow-hidden rounded-md">
        <iframe
          className="h-full w-full"
          src="https://www.youtube-nocookie.com/embed/vRWGuybXnNk?si=ZSs38r4-Tb8lRo9u&amp;controls=0"
          title="YouTube video player"
          allow=""
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 flex w-full items-center gap-4 px-10 py-6 text-pink-400">
        <button>
          <Gauge />
        </button>
        <button>
          <CirclePlay />
        </button>

        <p className="whitespace-pre">00:00 / 00:00</p>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
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
