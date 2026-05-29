const API_BASE = '/api/xiaoyun';

async function apiPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `服务异常 (${res.status})` }));
    throw new Error(err.error || `AI 服务异常 (${res.status})`);
  }

  return res.json();
}

export async function generatePlan(tasks: string, timeRange: { start: string; end: string }, constraints?: string) {
  const data = await apiPost('/plan', { tasks, timeRange, constraints });
  return { plans: data.plans, conversationId: data.conversationId };
}

export async function generateAlternatives(feedback: string, conversationId?: string) {
  const data = await apiPost('/replan', { feedback, conversationId });
  return { plans: data.plans };
}

export async function generateMotivation(context: { completedTasks: string; date: string; notes?: string }) {
  const data = await apiPost('/motivation', { context });
  return { text: data.text };
}

export async function generateWeeklyReport(stats: {
  totalDaysTracked: number;
  totalTasksCompleted: number;
  totalFocusHours: number;
  averageCompletionRate: number;
  streakDays: number;
  bestDay?: { date: string; completionRate: number };
}) {
  const data = await apiPost('/weekly-report', { stats });
  return { report: data.report };
}
