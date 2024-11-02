import { formatTimestamp } from '@/lib/utils';

export default function Scrubber({
  curTime,
  duration,
  seekTo,
}: {
  curTime: number;
  duration: number;
  seekTo: Function;
}) {
  return (
    <>
      <p className="whitespace-pre tabular-nums">
        {formatTimestamp(curTime)} / {formatTimestamp(duration)}
      </p>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-600">
        <div
          className="h-full w-1/2 rounded-full bg-pink-400"
          style={{ width: duration ? `${(curTime / duration) * 100}` : '0%' }}
        ></div>
      </div>
    </>
  );
}
