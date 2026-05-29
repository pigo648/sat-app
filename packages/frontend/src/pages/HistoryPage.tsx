import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import EmptyState from '../components/ui/EmptyState';
import { db } from '../db/database';
import type { DailyPlan } from '../types/task';
import { PHASE_LABELS } from '../utils/constants';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<(DailyPlan & { taskCount: number; completedCount: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const allPlans = await db.dailyPlans.orderBy('date').reverse().limit(50).toArray();
    const enriched = await Promise.all(
      allPlans.map(async (plan) => {
        const tasks = await db.tasks.where('dailyPlanId').equals(plan.id!).toArray();
        const completed = tasks.filter((t) => t.status === 'completed').length;
        return { ...plan, taskCount: tasks.length, completedCount: completed };
      })
    );
    setPlans(enriched);
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

  return (
    <PageContainer>
      <h2 className="text-base font-semibold text-gray-700 mb-4">历史记录</h2>

      {plans.length === 0 ? (
        <EmptyState icon="📊" message="还没有历史记录" description="完成一天的任务后，这里将会显示记录" />
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => {
            const rate = plan.taskCount > 0 ? plan.completedCount / plan.taskCount : 0;
            const today = new Date().toISOString().split('T')[0];
            const isToday = plan.date === today;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl p-4 shadow-sm cursor-pointer active:bg-gray-50 transition-colors"
                onClick={() => navigate(`/history/${plan.date}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-800">{plan.date}</span>
                      {isToday && (
                        <span className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">今天</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {plan.timeRangeStart} - {plan.timeRangeEnd}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${rate >= 1 ? 'text-green-500' : rate > 0.5 ? 'text-primary-600' : 'text-gray-400'}`}>
                      {plan.completedCount}/{plan.taskCount}
                    </div>
                    <div className="text-xs text-gray-400">完成率 {Math.round(rate * 100)}%</div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-3 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${rate >= 1 ? 'bg-green-400' : 'bg-primary-500'}`}
                    style={{ width: `${rate * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
