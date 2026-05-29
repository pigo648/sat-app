import { useEffect, useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { db } from '../db/database';
import type { DailyStats, AllTimeStats } from '../types/task';
import { getWeekDates, getTodayDate } from '../utils/time';
import DonutChart from '../components/stats/DonutChart';
import BarChart from '../components/stats/BarChart';

export default function StatsPage() {
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<AllTimeStats | null>(null);
  const [weekStats, setWeekStats] = useState<DailyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const today = getTodayDate();
      const ds = await computeDailyStats(today);
      setDailyStats(ds);

      const weekDates = getWeekDates();
      const ws: DailyStats[] = [];
      for (const d of weekDates) {
        ws.push(await computeDailyStats(d));
      }
      setWeekStats(ws);

      const allTime = await computeAllTimeStats();
      setAllTimeStats(allTime);
    } catch (e) {
      console.error('Stats load error:', e);
    }
    setIsLoading(false);
  };

  const computeDailyStats = async (date: string): Promise<DailyStats> => {
    const plan = await db.dailyPlans.where('date').equals(date).first();
    if (!plan?.id) {
      return { date, totalTasks: 0, completedTasks: 0, skippedTasks: 0, completionRate: 0, morningTasks: 0, morningCompleted: 0, afternoonTasks: 0, afternoonCompleted: 0, eveningTasks: 0, eveningCompleted: 0, totalFocusSeconds: 0, avgFocusPerTaskSeconds: 0 };
    }
    const tasks = await db.tasks.where('dailyPlanId').equals(plan.id).toArray();
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const skipped = tasks.filter((t) => t.status === 'skipped').length;
    const morning = tasks.filter((t) => t.phase === 'morning');
    const afternoon = tasks.filter((t) => t.phase === 'afternoon');
    const evening = tasks.filter((t) => t.phase === 'evening');
    const sessions = await db.focusSessions.filter((s) => {
      const d = new Date(s.startTime);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` === date;
    }).toArray();
    const completedSessions = sessions.filter((s) => s.completed);
    const totalFocus = completedSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0);
    return {
      date, totalTasks: total, completedTasks: completed, skippedTasks: skipped,
      completionRate: total > 0 ? completed / total : 0,
      morningTasks: morning.length, morningCompleted: morning.filter((t) => t.status === 'completed').length,
      afternoonTasks: afternoon.length, afternoonCompleted: afternoon.filter((t) => t.status === 'completed').length,
      eveningTasks: evening.length, eveningCompleted: evening.filter((t) => t.status === 'completed').length,
      totalFocusSeconds: totalFocus,
      avgFocusPerTaskSeconds: completed > 0 ? totalFocus / completed : 0,
    };
  };

  const computeAllTimeStats = async (): Promise<AllTimeStats> => {
    const allPlans = await db.dailyPlans.toArray();
    const allTasks = await db.tasks.toArray();
    const allSessions = await db.focusSessions.toArray();
    const completedSessions = allSessions.filter((s) => s.completed);
    const totalHours = completedSessions.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / 3600;
    const completed = allTasks.filter((t) => t.status === 'completed').length;
    const avgRate = allTasks.length > 0 ? completed / allTasks.length : 0;

    // Calculate streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const plan = allPlans.find((p) => p.date === dateStr);
      if (!plan?.id) break;
      const planTasks = allTasks.filter((t) => t.dailyPlanId === plan.id);
      if (planTasks.length === 0 || planTasks.some((t) => t.status === 'pending')) break;
      streak++;
    }

    return {
      totalDaysTracked: allPlans.length,
      totalTasksCompleted: completed,
      totalFocusHours: Math.round(totalHours * 10) / 10,
      averageCompletionRate: avgRate,
      streakDays: streak,
      bestDay: { date: '', completionRate: 0 },
    };
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard label="累计专注" value={allTimeStats?.totalFocusHours ?? 0} unit="小时" color="blue" />
        <StatCard label="完成任务" value={allTimeStats?.totalTasksCompleted ?? 0} unit="项" color="green" />
        <StatCard label="平均完成率" value={Math.round((allTimeStats?.averageCompletionRate ?? 0) * 100)} unit="%" color="yellow" />
        <StatCard label="连续天数" value={allTimeStats?.streakDays ?? 0} unit="天" color="purple" />
      </div>

      {/* Today's Completion */}
      {dailyStats && dailyStats.totalTasks > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">今日完成情况</h3>
          <div className="flex justify-center">
            <DonutChart
              completed={dailyStats.completedTasks}
              total={dailyStats.totalTasks}
              skipped={dailyStats.skippedTasks}
            />
          </div>
          <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-primary-500" /> 上午 {dailyStats.morningCompleted}/{dailyStats.morningTasks}</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-400" /> 下午 {dailyStats.afternoonCompleted}/{dailyStats.afternoonTasks}</div>
            <div className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-500" /> 晚上 {dailyStats.eveningCompleted}/{dailyStats.eveningTasks}</div>
          </div>
        </div>
      )}

      {/* Weekly Trend */}
      {weekStats.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">近7日完成率趋势</h3>
          <BarChart data={weekStats.map((s) => ({
            label: s.date.slice(5),
            value: Math.round(s.completionRate * 100),
          }))} />
        </div>
      )}
    </PageContainer>
  );
}

function StatCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    purple: 'bg-purple-50 text-purple-600',
  };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        <span className={`text-xs font-medium ${colors[color]?.split(' ')[1] ?? 'text-gray-400'}`}>{unit}</span>
      </div>
    </div>
  );
}
