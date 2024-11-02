import { formatTimestamp } from '@/lib/utils';
import { useState, useCallback } from 'react';

export default function Scrubber({
  curTime,
  duration,
  seekTo,
}: {
  curTime: number;
  duration: number;
  seekTo: Function;
}) {
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const time = percentage * duration;
      setHoveredTime(Math.max(0, Math.min(duration, time)));
      setHoverPosition(x);
    },
    [duration],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredTime(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const time = percentage * duration;
      seekTo(Math.max(0, Math.min(duration, time)));
    },
    [duration, seekTo],
  );

  return (
    <div className="flex w-full items-center gap-3">
      <p className="whitespace-pre tabular-nums">
        {formatTimestamp(curTime)} / {formatTimestamp(duration)}
      </p>
      {/* Interactive area with padding */}
      <div
        className="relative w-full cursor-pointer py-2"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      >
        {/* Hover time label */}
        {hoveredTime !== null && (
          <div
            className="absolute -top-8 -translate-x-1/2 transform rounded bg-black/80 px-2 py-1 text-xs text-white backdrop-blur-sm"
            style={{ left: hoverPosition }}
          >
            {formatTimestamp(hoveredTime)}
          </div>
        )}
        {/* Progress bar */}
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-600">
          {/* Hover preview */}
          {hoveredTime !== null && (
            <div
              className="absolute h-full rounded-full bg-pink-400/30"
              style={{ width: `${(hoveredTime / duration) * 100}%` }}
            />
          )}
          {/* Current progress */}
          <div
            className="absolute h-full rounded-full bg-pink-400"
            style={{
              width: duration ? `${(curTime / duration) * 100}%` : '0%',
            }}
          />
        </div>
      </div>
    </div>
  );
}
