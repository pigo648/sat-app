import { useState, useEffect } from 'react';
import XiaoYunAvatar from './XiaoYunAvatar';

interface Props {
  onClick: () => void;
  hasPlan: boolean;
  completedCount?: number;
  totalCount?: number;
}

function getGreeting(hasPlan: boolean, completed: number, total: number): string {
  const h = new Date().getHours();

  if (!hasPlan) {
    if (h < 9) return '早上好～今天有什么计划吗？';
    if (h < 12) return '上午好！需要我帮你规划今天吗？';
    if (h < 18) return '下午好～要不要安排一下接下来的时间？';
    return '晚上好！明天想做什么，可以先告诉我哦～';
  }

  if (completed === total && total > 0) {
    return '太棒了！今天的任务全部完成啦～记得拍照打卡哦！';
  }

  if (completed > 0) {
    return `已经完成 ${completed}/${total} 项任务啦，继续加油～`;
  }

  if (h < 9) return '早上好！今天有满满的计划呢，开始行动吧～';
  if (h < 12) return '上午精力最充沛，先从重要的开始吧！';
  if (h < 18) return '下午好～按计划推进中，需要调整随时找我哦～';
  return '晚上好～还有任务没完成的话，我帮你重新安排一下？';
}

export default function XiaoYunEntrance({ onClick, hasPlan, completedCount = 0, totalCount = 0 }: Props) {
  const [isVisible, setIsVisible] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setIsVisible(true), 300);
    const t2 = setTimeout(() => setShowBubble(true), 1000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Auto-hide bubble after 8 seconds
  useEffect(() => {
    if (!showBubble) return;
    const t = setTimeout(() => setShowBubble(false), 8000);
    return () => clearTimeout(t);
  }, [showBubble]);

  const greeting = getGreeting(hasPlan, completedCount, totalCount);

  return (
    <div
      className={`fixed bottom-24 right-4 z-20 flex flex-col items-end gap-2 transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      {/* Speech bubble */}
      {showBubble && (
        <div
          className="bg-white rounded-2xl rounded-br-sm px-4 py-2.5 shadow-lg border border-gray-100 max-w-[200px] animate-slide-up"
        >
          <p className="text-sm text-gray-700 leading-relaxed">{greeting}</p>
          <button
            className="text-[10px] text-primary-500 mt-1 hover:text-primary-700 transition-colors"
            onClick={() => setShowBubble(false)}
          >
            知道了
          </button>
          {/* Bubble tail */}
          <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-white border-r border-b border-gray-100 transform rotate-45" />
        </div>
      )}

      {/* Avatar button */}
      <button
        className="relative group"
        onClick={onClick}
        onMouseEnter={() => setShowBubble(true)}
      >
        <XiaoYunAvatar
          state="idle"
          size={64}
        />
        {/* Pulse ring on hover */}
        <div className="absolute inset-0 rounded-full border-2 border-primary-300 opacity-0 group-hover:opacity-100 transition-opacity animate-ping" />
      </button>
    </div>
  );
}
