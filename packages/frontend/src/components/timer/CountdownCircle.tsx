interface Props {
  progress: number;
  remainingSeconds: number;
  totalSeconds: number;
  isRunning: boolean;
}

export default function CountdownCircle({ progress, isRunning }: Props) {
  const size = 220;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.8)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="timer-ring"
        />
      </svg>
      {/* Center status */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`w-3 h-3 rounded-full mb-2 ${isRunning ? 'bg-green-400 animate-pulse-soft' : 'bg-white/50'}`} />
        <span className="text-xs text-white/60">
          {isRunning ? '专注中' : '暂停'}
        </span>
      </div>
    </div>
  );
}
