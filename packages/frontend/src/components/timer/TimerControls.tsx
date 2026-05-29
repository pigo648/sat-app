interface Props {
  isRunning: boolean;
  isPaused: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onComplete: () => void;
}

export default function TimerControls({ isRunning, isPaused, onPlay, onPause, onReset, onComplete }: Props) {
  return (
    <div className="flex items-center justify-center gap-4">
      {/* Reset */}
      <button
        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        onClick={onReset}
        title="重置"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>

      {/* Play/Pause */}
      <button
        className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg hover:bg-gray-100 active:scale-95 transition-all"
        onClick={isRunning ? onPause : onPlay}
      >
        {isRunning ? (
          <svg className="w-8 h-8 text-primary-700" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-8 h-8 text-primary-700 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Complete */}
      <button
        className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        onClick={onComplete}
        title="完成"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
}
