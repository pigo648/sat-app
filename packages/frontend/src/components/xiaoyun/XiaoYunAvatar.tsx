import { useState, useEffect } from 'react';

type AvatarState = 'idle' | 'listening' | 'thinking' | 'happy';

interface Props {
  state?: AvatarState;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export default function XiaoYunAvatar({ state = 'idle', size = 80, onClick, className = '' }: Props) {
  const [blink, setBlink] = useState(false);
  const [float, setFloat] = useState(0);

  // Random blinking
  useEffect(() => {
    const interval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 3000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, []);

  // Floating animation
  useEffect(() => {
    if (state === 'thinking') return;
    let frame: number;
    let start = Date.now();
    const animate = () => {
      const elapsed = (Date.now() - start) / 1000;
      setFloat(Math.sin(elapsed * 1.5) * 4);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [state]);

  const scale = size / 80;
  const isInteractive = !!onClick;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${isInteractive ? 'cursor-pointer' : ''} ${className}`}
      style={{
        width: size + 16,
        height: size + 16,
        transform: `translateY(${float}px)`,
        transition: 'transform 0.3s ease',
      }}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      aria-label="小云助手"
    >
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: 'radial-gradient(circle, #60A5FA 0%, transparent 70%)',
          animation: state === 'thinking' ? 'spin 3s linear infinite' : 'pulse 3s ease-in-out infinite',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="0 0 80 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <linearGradient id="cloudGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <linearGradient id="cheekGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FCA5A5" />
            <stop offset="100%" stopColor="#F87171" />
          </linearGradient>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1E40AF" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Cloud body */}
        <g filter="url(#softShadow)">
          <ellipse cx="40" cy="48" rx="28" ry="20" fill="url(#cloudGrad)" />
          <circle cx="24" cy="42" r="14" fill="url(#cloudGrad)" />
          <circle cx="56" cy="42" r="14" fill="url(#cloudGrad)" />
          <circle cx="32" cy="34" r="12" fill="url(#cloudGrad)" />
          <circle cx="48" cy="34" r="12" fill="url(#cloudGrad)" />
        </g>

        {/* Face */}
        <g>
          {/* Eyes */}
          {blink ? (
            <>
              <line x1="32" y1="44" x2="36" y2="44" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" />
              <line x1="44" y1="44" x2="48" y2="44" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" />
            </>
          ) : state === 'happy' ? (
            <>
              <path d="M31 43 Q34 39 37 43" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M43 43 Q46 39 49 43" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" fill="none" />
            </>
          ) : (
            <>
              <circle cx="34" cy="43" r="2.5" fill="#1E3A5F" />
              <circle cx="46" cy="43" r="2.5" fill="#1E3A5F" />
              {/* Eye shine */}
              <circle cx="34.8" cy="42.2" r="0.8" fill="white" />
              <circle cx="46.8" cy="42.2" r="0.8" fill="white" />
            </>
          )}

          {/* Mouth */}
          {state === 'happy' ? (
            <path d="M35 50 Q40 56 45 50" stroke="#1E3A5F" strokeWidth="2" strokeLinecap="round" fill="none" />
          ) : state === 'thinking' ? (
            <circle cx="40" cy="51" r="2" fill="#1E3A5F" opacity="0.6" />
          ) : state === 'listening' ? (
            <ellipse cx="40" cy="50" rx="4" ry="3" fill="#1E3A5F" opacity="0.7" />
          ) : (
            <path d="M36 49 Q40 53 44 49" stroke="#1E3A5F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
          )}

          {/* Blush cheeks */}
          <ellipse cx="28" cy="46" rx="4" ry="2.5" fill="url(#cheekGrad)" opacity="0.3" />
          <ellipse cx="52" cy="46" rx="4" ry="2.5" fill="url(#cheekGrad)" opacity="0.3" />
        </g>

        {/* Thinking animation */}
        {state === 'thinking' && (
          <g>
            <circle cx="62" cy="28" r="2" fill="#93C5FD" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" begin="0s" />
            </circle>
            <circle cx="68" cy="22" r="2.5" fill="#93C5FD" opacity="0.6">
              <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
            </circle>
            <circle cx="75" cy="18" r="3" fill="#93C5FD" opacity="0.4">
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
            </circle>
          </g>
        )}

        {/* Listening ripple */}
        {state === 'listening' && (
          <g>
            <circle cx="40" cy="48" r="32" fill="none" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values="28;36" dur="1s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.6;0" dur="1s" repeatCount="indefinite" />
            </circle>
            <circle cx="40" cy="48" r="32" fill="none" stroke="#93C5FD" strokeWidth="1.5" opacity="0.6">
              <animate attributeName="r" values="28;36" dur="1s" repeatCount="indefinite" begin="0.5s" />
              <animate attributeName="opacity" values="0.6;0" dur="1s" repeatCount="indefinite" begin="0.5s" />
            </circle>
          </g>
        )}
      </svg>
    </div>
  );
}
