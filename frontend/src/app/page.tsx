'use client';

import Stage from '@/components/Stage';
import './globals.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Pause, Play, SwitchCamera } from 'lucide-react';
import { cn } from '@/lib/utils';
import Scrubber from '@/components/Scrubber';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Page() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState('');
  const [numDancers, setNumDancers] = useState(5); // Default number of dancers
  const [positionsData, setPositionsData] = useState([]);
  const [currentPositionMatrix, setCurrentPositionMatrix] = useState([]);
  const [cameraView, setCameraView] = useState(true);
  const [signedVideoUrl, setSignedVideoUrl] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [duration, setDuration] = useState(0);
  const [curTime, setCurTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [songTitle, setSongTitle] = useState('Unknown Song');
  const [artist, setArtist] = useState('Unknown Artist');
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fetchPositions = useCallback(
    async (searchQuery: string, numDancers: number) => {
      setLoading(true);
      try {
        // Send the query and numDancers to the backend API
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/process-video`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: searchQuery, num_dancers: numDancers }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch positions');
        }

        const data = await response.json();
        console.log(data);

        setPositionsData(data.positions);
        setSongTitle(data.song || 'Unknown Song');
        setArtist(data.artist || 'Unknown Artist');

        // Set the local video URL
        setSignedVideoUrl(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}${data.video_url}`
        );
        setLoading(false);

        // Update the URL with the query parameter and numDancers
        router.push(
          `?query=${encodeURIComponent(searchQuery)}&numDancers=${numDancers}`
        );
        setHasFetched(true);
      } catch (error) {
        console.error('Error fetching positions:', error);
        setLoading(false);
      }
    },
    [router]
  );

  // Fetch positions if there's a query parameter
  useEffect(() => {
    const queryParam = searchParams.get('query') || '';
    const numDancersParam = searchParams.get('numDancers');
    const numDancersValue = numDancersParam ? parseInt(numDancersParam) : 5;

    if (queryParam && !hasFetched) {
      setQuery(queryParam);
      setNumDancers(numDancersValue);
      fetchPositions(queryParam, numDancersValue);
    }
  }, [searchParams, fetchPositions, hasFetched]);

  // Reset hasFetched when query or numDancers changes
  useEffect(() => {
    const queryParam = searchParams.get('query') || '';
    const numDancersParam = searchParams.get('numDancers');
    const numDancersValue = numDancersParam ? parseInt(numDancersParam) : 5;

    if (queryParam !== query || numDancersValue !== numDancers) {
      setHasFetched(false);
    }
  }, [searchParams]);

  const seekTo = useCallback(
    (time: number) => {
      const clampedTime = Math.min(duration, Math.max(time, 0));
      setCurTime(clampedTime);

      const video = videoRef.current;
      if (!video) return;
      video.currentTime = clampedTime;
    },
    [duration]
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
  }, [videoLoaded]);

  const keyHandler = useCallback(
    (e: KeyboardEvent) => {
      // Do not handle keyboard shortcuts if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === 'c') {
        setCameraView((prev) => !prev);
      }

      if (!videoLoaded) return;
      if (e.key === 'ArrowLeft') seekTo(Math.max(0, curTime - 5));
      if (e.key === 'ArrowRight') seekTo(Math.min(duration, curTime + 5));
      if (e.key === ' ') {
        e.preventDefault(); // Prevent default spacebar scrolling behavior
        togglePlayPause();
      }
    },
    [videoLoaded, duration, isPlaying, curTime, seekTo, togglePlayPause]
  );


  // Initialize component
  useEffect(() => {
    // Keybinds
    window.addEventListener('keydown', keyHandler);
    return () => {
      window.removeEventListener('keydown', keyHandler);
    };
  }, [keyHandler]);

  // Keep curTime and play/pause in sync with video
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const handleTimeUpdate = () => setCurTime(videoEl.currentTime ?? 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    videoEl.addEventListener('play', handlePlay);
    videoEl.addEventListener('pause', handlePause);
    videoEl.addEventListener('ended', handleEnded);

    return () => {
      videoEl.removeEventListener('timeupdate', handleTimeUpdate);
      videoEl.removeEventListener('play', handlePlay);
      videoEl.removeEventListener('pause', handlePause);
      videoEl.removeEventListener('ended', handleEnded);
    };
  }, [videoRef.current]);

  // Update currentPositionMatrix based on curTime
  useEffect(() => {
    if (positionsData.length === 0) return;

    // Find the closest position matrix based on current time
    let closestEntry = positionsData[0];
    let minTimeDiff = Math.abs(curTime - positionsData[0][0]);

    for (let i = 1; i < positionsData.length; i++) {
      const timeDiff = Math.abs(curTime - positionsData[i][0]);
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestEntry = positionsData[i];
      }
    }

    if (closestEntry) {
      setCurrentPositionMatrix(closestEntry[1]);
    }
  }, [curTime, positionsData]);

  const onVideoLoadMetadata = () => {
    setVideoLoaded(true);
    setDuration(videoRef.current?.duration || 0);
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#2a272d]">
      {/* Loading Indicator */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-50">
          <Loader2 className="h-10 w-10 animate-spin text-white" />
          <p className="text-white mt-4">Processing video...</p>
        </div>
      )}

      {/* Stage */}
      <Stage
        positions={currentPositionMatrix}
        cameraView={cameraView}
        width={15}
        depth={15}
        size={2}
      />

       {/* Container for title and search form */}
      <div className="absolute left-0 top-0 m-6 select-none text-white">
        <p className="text-3xl font-black">{songTitle}</p>
        <p>{artist}</p>

        {/* Search Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (query.trim() !== '') {
              fetchPositions(query.trim(), numDancers);
            }
          }}
          className="flex items-center space-x-2 mt-4"
        >
          <input
            type="text"
            placeholder="Enter song or dance query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="px-4 py-2 rounded-md bg-white text-black"
          />
          <input
            type="number"
            min="1"
            max="100"
            placeholder="Number of dancers"
            value={numDancers}
            onChange={(e) => setNumDancers(parseInt(e.target.value))}
            className="px-4 py-2 rounded-md bg-white text-black w-32"
          />
          <Button type="submit">Search</Button>
        </form>
      </div>
      {/* Video */}
      {signedVideoUrl && (
        <div
          className={cn(
            'absolute right-0 top-0 m-6 flex aspect-video w-80 items-center justify-center overflow-hidden rounded-md lg:w-96',
            !videoLoaded ? 'animate-pulse bg-black' : ''
          )}
        >
          <Loader2
            className={cn(
              'absolute h-10 w-10 text-white',
              !videoLoaded ? 'animate-spin' : 'hidden'
            )}
          />
          <video
            src={signedVideoUrl}
            className="absolute h-full w-full opacity-80"
            ref={videoRef}
            onLoadedMetadata={onVideoLoadMetadata}
            controls
          />
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          'absolute bottom-10 left-1/2 flex w-full max-w-2xl -translate-x-1/2 select-none items-center gap-1 rounded-2xl px-4 py-2 text-pink-400 backdrop-blur-sm',
          !videoLoaded && 'pointer-events-none grayscale',
          'transition-all'
        )}
      >
        <Button variant="icon" onClick={togglePlayPause}>
          {!isPlaying ? (
            <Play className="fill-pink-400" size={20} />
          ) : (
            <Pause className="fill-pink-400" size={20} />
          )}
        </Button>

        <Scrubber curTime={curTime} duration={duration} seekTo={seekTo} />

        <Button variant="icon" onClick={() => setCameraView((x) => !x)}>
          <SwitchCamera />
        </Button>
      </div>
    </div>
  );
}
