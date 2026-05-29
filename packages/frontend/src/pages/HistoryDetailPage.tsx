import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { db } from '../db/database';
import type { Task, DailyPlan } from '../types/task';
import { STATUS_LABELS, PRIORITY_COLORS } from '../utils/constants';

export default function HistoryDetailPage() {
  const { date } = useParams<{ date: string }>();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!date) return;
    loadDayData(date);
  }, [date]);

  const loadDayData = async (date: string) => {
    const p = await db.dailyPlans.where('date').equals(date).first();
    if (!p) {
      setIsLoading(false);
      return;
    }
    setPlan(p);
    const t = await db.tasks.where('dailyPlanId').equals(p.id!).sortBy('sortOrder');
    setTasks(t);
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!plan) {
    return (
      <PageContainer>
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">该日期没有记录</p>
          <button className="text-primary-500 underline" onClick={() => navigate('/history')}>
            返回历史列表
          </button>
        </div>
      </PageContainer>
    );
  }

  const completed = tasks.filter((t) => t.status === 'completed').length;
  const rate = tasks.length > 0 ? completed / tasks.length : 0;

  return (
    <PageContainer>
      <button
        className="mb-4 text-sm text-primary-600 flex items-center gap-1 min-touch"
        onClick={() => navigate('/history')}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回历史列表
      </button>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-xl font-bold text-gray-800">{date}</h2>
        <p className="text-sm text-gray-400 mt-1">
          时间范围: {plan.timeRangeStart} - {plan.timeRangeEnd}
        </p>
        <div className="flex items-center gap-4 mt-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary-600">{tasks.length}</div>
            <div className="text-xs text-gray-400">总任务</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{completed}</div>
            <div className="text-xs text-gray-400">已完成</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{Math.round(rate * 100)}%</div>
            <div className="text-xs text-gray-400">完成率</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700">任务详情</h3>
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-xl p-3 shadow-sm border-l-4"
            style={{ borderLeftColor: PRIORITY_COLORS[task.priority] ?? '#D1D5DB' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {task.name}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {task.startTime}-{task.endTime} · {task.durationMinutes}min
                </div>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.status === 'completed' ? 'bg-green-50 text-green-600' :
                task.status === 'skipped' ? 'bg-gray-100 text-gray-400' :
                'bg-yellow-50 text-yellow-600'
              }`}>
                {STATUS_LABELS[task.status]}
              </span>
            </div>
          </div>
        ))}
      </div>
    </PageContainer>
  );
}
