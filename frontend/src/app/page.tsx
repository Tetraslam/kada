'use client';
import Stage from '@/components/Stage';
import './globals.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Download, Loader2, Pause, Play, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import Scrubber from '@/components/Scrubber';
import { Button } from '@/components/ui/button';

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
  const [duration, setDuration] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handlers
  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.min(duration, Math.max(time, 0));
      setCurTime(clampedTime);

      const video = videoRef.current;
      if (!video) return;
      video.currentTime = clampedTime;
    },
    [duration, isPlaying],
  );
  const togglePlayPause = useCallback(() => {
    if (!videoLoaded || !videoRef.current) return;
    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  }, [videoLoaded, isPlaying]);

  const keyHandler = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'c') {
        setCameraView((prev) => !prev);
      }

      if (!videoLoaded) return;
      if (e.key === 'ArrowLeft') seekTo(Math.max(0, curTime - 5));
      if (e.key === 'ArrowRight') seekTo(Math.min(duration, curTime + 5));
      if (e.key === ' ') togglePlayPause();
    },
    [videoLoaded, duration, isPlaying, curTime],
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
    window.onkeydown = keyHandler;
  }, [setCameraView, keyHandler, signedVideoUrl]);

  // Keep curTime and play/pause in sync with video
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.ontimeupdate = () => setCurTime(videoRef.current?.currentTime ?? 0);
    videoEl.onplay = () => setIsPlaying(true);
    videoEl.onpause = () => setIsPlaying(false);
    videoEl.onended = () => setIsPlaying(false);
  }, [videoRef.current]);

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
          'absolute right-0 top-0 m-6 flex aspect-video w-80 items-center justify-center overflow-hidden rounded-md lg:w-96',
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
      <div className="absolute bottom-10 left-1/2 flex w-full max-w-2xl -translate-x-1/2 items-center gap-4 rounded-2xl px-6 py-4 text-pink-400 backdrop-blur-sm">
        <Button variant="icon" onClick={togglePlayPause}>
          {!isPlaying ? (
            <Play className="fill-pink-400" size={20} />
          ) : (
            <Pause className="fill-pink-400" size={20} />
          )}
        </Button>

        <Scrubber curTime={curTime} duration={duration} seekTo={seekTo} />

        <Button variant="icon" onClick={() => setCameraView((x) => !x)}>
          <Camera />
        </Button>
        <Button variant="icon">
          <Download />
        </Button>
      </div>
    </div>
  );
}
