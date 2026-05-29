import { useEffect, useState } from 'react';
import { db } from '../../db/database';
import { getTodayDate } from '../../utils/time';

interface WidgetData {
  completed: number;
  total: number;
  rate: number;
  currentTask: string;
  phase: string;
}

export default function ProgressWidget() {
  const [data, setData] = useState<WidgetData | null>(null);

  useEffect(() => {
    loadWidgetData();
    const interval = setInterval(loadWidgetData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadWidgetData = async () => {
    const today = getTodayDate();
    const plan = await db.dailyPlans.where('date').equals(today).first();
    if (!plan?.id) { setData(null); return; }

    const tasks = await db.tasks.where('dailyPlanId').equals(plan.id).sortBy('sortOrder');
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const rate = total > 0 ? completed / total : 0;
    const inProgress = tasks.find((t) => t.status === 'in_progress');
    const currentTask = inProgress?.name || tasks.find((t) => t.status === 'pending')?.name || '';

    const h = new Date().getHours();
    const phase = h < 12 ? '上午' : h < 18 ? '下午' : '晚上';

    setData({ completed, total, rate, currentTask, phase });
  };

  if (!data || data.total === 0) return null;

  return (
    <div className="bg-gradient-to-br from-primary-600 to-blue-700 rounded-2xl p-4 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <span className="text-sm font-semibold text-white/90">今日概览</span>
        </div>
        <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{data.phase}好</span>
      </div>

      {/* Progress Ring + Stats */}
      <div className="flex items-center gap-4">
        {/* Mini Ring */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="5" />
            <circle
              cx="32" cy="32" r="28" fill="none" stroke="white" strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${data.rate * 176} 176`}
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold">{Math.round(data.rate * 100)}%</span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-2xl font-bold">
            {data.completed}<span className="text-base font-normal text-white/60">/{data.total}</span>
          </div>
          <div className="text-xs text-white/70">项已完成</div>
          {data.currentTask && (
            <div className="mt-1.5 text-xs text-white/80 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0" />
              {data.currentTask}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-white/20 rounded-full h-1 overflow-hidden">
        <div
          className="h-full bg-white/80 rounded-full transition-all duration-700"
          style={{ width: `${data.rate * 100}%` }}
        />
      </div>

      {data.completed === data.total && data.total > 0 && (
        <div className="mt-2 text-center text-xs text-white/90 bg-white/10 rounded-lg py-1.5">
          全部完成！太棒了
        </div>
      )}
    </div>
  );
}
