'use client';

import Stage from '@/components/Stage';
import './globals.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Camera,
  CirclePlay,
  Download,
  Gauge,
  Loader,
  Loader2,
  Upload,
} from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import Scrubber from '@/components/Scrubber';

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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handlers
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.min(duration, Math.max(time, 0));
      setCurTime(clampedTime);
      if (videoRef.current) videoRef.current.currentTime = clampedTime;
    },
    [duration],
  );

  const keyHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'c') {
        setCameraView((prev) => !prev);
      }
      if (e.key === 'ArrowLeft') {
        if (videoLoaded) seekTo(curTime - 5);
      }
      if (e.key === 'ArrowRight') {
        if (videoLoaded) seekTo(curTime + 5);
      }
    },
    [videoLoaded, curTime, seekTo],
  );

  // Initialize component
  useEffect(() => {
    (async () => {
      if (signedVideoUrl) return;

      // Get signed Supabase URL for video playback
      const { data, error } = await supabase.storage
        .from('video')
        .createSignedUrl('armageddon.mp4', 3600);

      if (error || !data.signedUrl) {
        console.error('Error fetching signed video URL:', error);
      } else {
        setSignedVideoUrl(data.signedUrl);
      }
    })();

    // Keybinds
    if (!setCameraView) return;
    window.addEventListener('keydown', keyHandler, true);
    return () => window.removeEventListener('keydown', keyHandler);
  }, [setCameraView, videoLoaded]);

  const onVideoLoadMetadata = () => {
    setVideoLoaded(true);
    setDuration(videoRef.current?.duration || 0);
  };

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
      <div
        className={cn(
          'absolute right-0 top-0 m-6 flex aspect-video w-80 items-center justify-center overflow-hidden rounded-md',
          !videoLoaded ? 'animate-pulse bg-black' : '',
        )}
      >
        <Loader2
          className={cn(
            'absolute h-10 w-10 text-white',
            !videoLoaded ? 'animate-spin' : 'hidden',
          )}
        />
        <video
          src={signedVideoUrl}
          className="absolute h-full w-full opacity-80"
          ref={videoRef}
          onLoadedMetadata={onVideoLoadMetadata}
        />
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

        <Scrubber curTime={curTime} duration={duration} seekTo={seekTo} />

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
